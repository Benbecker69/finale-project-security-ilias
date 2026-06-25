<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../api/client.js';

const orders = ref([]);
const error = ref('');

async function load() {
  try {
    orders.value = await api('/api/orders');
  } catch (e) {
    error.value = e.message;
  }
}
onMounted(load);
</script>

<template>
  <h2>My orders</h2>
  <p v-if="error" class="error">{{ error }}</p>
  <table class="card">
    <thead>
      <tr><th>#</th><th>Status</th><th>Total</th><th>Date</th><th></th></tr>
    </thead>
    <tbody>
      <tr v-for="o in orders" :key="o.id">
        <td>{{ o.id }}</td>
        <td><span class="badge">{{ o.status }}</span></td>
        <td class="price">{{ o.total }} €</td>
        <td class="muted">{{ o.created_at }}</td>
        <td><router-link :to="`/orders/${o.id}`">open</router-link></td>
      </tr>
    </tbody>
  </table>
  <p class="muted">
    Ownership is enforced server-side: opening another user's order id returns 404.
  </p>
</template>
