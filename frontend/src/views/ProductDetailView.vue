<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../api/client.js';
import { auth } from '../store/auth.js';

const route = useRoute();
const product = ref(null);
const reviews = ref([]);
const content = ref('');
const rating = ref(5);
const error = ref('');

async function load() {
  error.value = '';
  try {
    product.value = await api(`/api/products/${route.params.id}`);
    reviews.value = await api(`/api/products/${route.params.id}/reviews`);
  } catch (e) {
    error.value = e.message;
  }
}

async function addReview() {
  error.value = '';
  try {
    await api(`/api/products/${route.params.id}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ content: content.value, rating: Number(rating.value) }),
    });
    content.value = '';
    await load();
  } catch (e) {
    error.value = e.message;
  }
}

onMounted(load);
</script>

<template>
  <router-link to="/products">← Back</router-link>
  <div v-if="product" class="card">
    <h2>{{ product.name }}</h2>
    <p class="muted">{{ product.description }}</p>
    <p class="price">{{ product.price }} €</p>
  </div>

  <h3>Reviews</h3>
  <p v-if="error" class="error">{{ error }}</p>

  <div class="card" v-for="r in reviews" :key="r.id">
    <strong>{{ r.author }}</strong> <span class="badge">★ {{ r.rating }}</span>
    <!-- SECURED (Stored XSS): content is rendered as TEXT via {{ }} interpolation, which
         Vue HTML-escapes. No v-html. A strict CSP (Helmet) is the defense-in-depth layer. -->
    <div class="review-content">{{ r.content }}</div>
  </div>

  <div class="card" v-if="auth.isLoggedIn">
    <h4>Add a review</h4>
    <textarea v-model="content" rows="3" placeholder="Your review"></textarea>
    <select v-model="rating">
      <option v-for="n in 5" :key="n" :value="n">{{ n }} ★</option>
    </select>
    <button @click="addReview">Post review</button>
  </div>
  <p v-else class="muted">Log in to post a review.</p>
</template>
