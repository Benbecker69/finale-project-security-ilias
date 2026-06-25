<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../api/client.js';

const products = ref([]);
const search = ref('');
const error = ref('');
const rawResponse = ref('');

async function load() {
  error.value = '';
  try {
    // VULNERABLE: the search term is sent straight to a SQL-injectable endpoint.
    const q = search.value ? `?search=${encodeURIComponent(search.value)}` : '';
    const data = await api(`/api/products${q}`);
    products.value = data;
    rawResponse.value = JSON.stringify(data, null, 2);
  } catch (e) {
    error.value = e.message;
  }
}

onMounted(load);
</script>

<template>
  <h2>Products</h2>
  <div class="card">
    <div style="display: flex; gap: 8px;">
      <input v-model="search" placeholder="Search products (try a SQL injection)..." @keyup.enter="load" />
      <button @click="load">Search</button>
    </div>
    <p class="muted">
      Demo SQLi payload:
      <code>zzz' UNION SELECT id, username, email, password, role, 'x', created_at FROM users --</code>
    </p>
  </div>

  <p v-if="error" class="error">{{ error }}</p>

  <div class="grid">
    <div class="card" v-for="p in products" :key="p.id">
      <h3>{{ p.name }}</h3>
      <p class="muted">{{ p.description }}</p>
      <p class="price">{{ p.price }} €</p>
      <router-link :to="`/products/${p.id}`">View & reviews →</router-link>
    </div>
  </div>

  <details class="card">
    <summary class="muted">Raw API response (shows leaked rows on injection)</summary>
    <pre style="white-space: pre-wrap;">{{ rawResponse }}</pre>
  </details>
</template>
