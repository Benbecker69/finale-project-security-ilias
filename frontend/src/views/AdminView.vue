<script setup>
import { ref, onMounted } from 'vue';
import { api, BASE } from '../api/client.js';

const users = ref([]);
const debug = ref(null);
const error = ref('');

async function load() {
  error.value = '';
  try {
    // VULNERABLE (Broken Access Control): this "admin" call succeeds for any
    // authenticated user because the backend never checks the role.
    users.value = await api('/api/admin/users');
  } catch (e) {
    error.value = e.message;
  }
  try {
    // VULNERABLE (Information Disclosure): unauthenticated debug endpoint.
    const res = await fetch(`${BASE}/api/debug`);
    debug.value = await res.json();
  } catch { /* ignore */ }
}
onMounted(load);
</script>

<template>
  <h2>Admin — users</h2>
  <p class="muted">
    This page calls <code>/api/admin/users</code>. On the vulnerable build it works
    even for a normal "user" account (no role check).
  </p>
  <p v-if="error" class="error">{{ error }}</p>
  <table class="card">
    <thead><tr><th>id</th><th>username</th><th>email</th><th>role</th><th>password hash</th></tr></thead>
    <tbody>
      <tr v-for="u in users" :key="u.id">
        <td>{{ u.id }}</td><td>{{ u.username }}</td><td>{{ u.email }}</td>
        <td><span class="badge">{{ u.role }}</span></td>
        <td class="muted" style="font-size:11px">{{ u.password }}</td>
      </tr>
    </tbody>
  </table>

  <h3>Leaked config (/api/debug)</h3>
  <pre class="card" style="white-space: pre-wrap; font-size: 12px;">{{ debug }}</pre>
</template>
