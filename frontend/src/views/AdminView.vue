<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../api/client.js';
import { auth } from '../store/auth.js';

const users = ref([]);
const error = ref('');

async function load() {
  error.value = '';
  try {
    // SECURED: this now returns 403 for non-admin users (server-side role check),
    // and never includes password hashes.
    users.value = await api('/api/admin/users');
  } catch (e) {
    error.value = e.status === 403 ? 'Forbidden — admin role required.' : e.message;
  }
}
onMounted(load);
</script>

<template>
  <h2>Admin — users</h2>
  <p class="muted">
    Server-side role enforcement: this page only returns data for an <strong>admin</strong> token.
    Current role: <span class="badge">{{ auth.user?.role }}</span>
  </p>
  <p v-if="error" class="error">{{ error }}</p>
  <table class="card" v-if="users.length">
    <thead><tr><th>id</th><th>username</th><th>email</th><th>role</th></tr></thead>
    <tbody>
      <tr v-for="u in users" :key="u.id">
        <td>{{ u.id }}</td><td>{{ u.username }}</td><td>{{ u.email }}</td>
        <td><span class="badge">{{ u.role }}</span></td>
      </tr>
    </tbody>
  </table>
</template>
