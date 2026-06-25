<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../api/client.js';

const route = useRoute();
const order = ref(null);
const error = ref('');

async function load() {
  error.value = '';
  order.value = null;
  try {
    // VULNERABLE (IDOR): the backend returns any order by id with no ownership
    // check. Changing the id in the URL exposes another user's order.
    order.value = await api(`/api/orders/${route.params.id}`);
  } catch (e) {
    error.value = e.message;
  }
}

onMounted(load);
watch(() => route.params.id, load);
</script>

<template>
  <router-link to="/orders">← Back to my orders</router-link>
  <p v-if="error" class="error">{{ error }}</p>
  <div v-if="order" class="card">
    <h2>Order #{{ order.id }}</h2>
    <p>Status: <span class="badge">{{ order.status }}</span></p>
    <p>Owner user_id: <strong>{{ order.user_id }}</strong></p>
    <p class="price">Total: {{ order.total }} €</p>
    <table>
      <thead><tr><th>Product</th><th>Qty</th><th>Price</th></tr></thead>
      <tbody>
        <tr v-for="it in order.items" :key="it.id">
          <td>#{{ it.product_id }}</td><td>{{ it.quantity }}</td><td>{{ it.price }} €</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
