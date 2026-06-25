<script setup>
import { useRouter } from 'vue-router';
import { auth } from './store/auth.js';

const router = useRouter();
function logout() {
  auth.logout();
  router.push('/login');
}
</script>

<template>
  <nav>
    <strong>🛒 ShopSec <span class="badge">vulnerable</span></strong>
    <router-link to="/products">Products</router-link>
    <router-link v-if="auth.isLoggedIn" to="/orders">My orders</router-link>
    <router-link v-if="auth.isLoggedIn" to="/admin">Admin</router-link>
    <span class="spacer"></span>
    <span v-if="auth.isLoggedIn" class="muted">
      {{ auth.user?.username }} ({{ auth.user?.role }})
    </span>
    <router-link v-if="!auth.isLoggedIn" to="/login">Login</router-link>
    <router-link v-if="!auth.isLoggedIn" to="/register">Register</router-link>
    <button v-if="auth.isLoggedIn" class="secondary" @click="logout">Logout</button>
  </nav>
  <div class="container">
    <router-view />
  </div>
</template>
