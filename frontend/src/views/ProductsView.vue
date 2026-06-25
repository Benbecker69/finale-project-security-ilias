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
    // SECURED: the backend uses a parameterized query for the search term.
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
      <input v-model="search" placeholder="Search products..." @keyup.enter="load" />
      <button @click="load">Search</button>
    </div>
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
    <summary class="muted">Raw API response</summary>
    <pre style="white-space: pre-wrap;">{{ rawResponse }}</pre>
  </details>
</template>
