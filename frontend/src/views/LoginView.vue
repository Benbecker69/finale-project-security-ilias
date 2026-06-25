<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { auth } from '../store/auth.js';

const email = ref('alice@shopsec.local');
const password = ref('Alice123!');
const error = ref('');
const router = useRouter();

async function submit() {
  error.value = '';
  try {
    await auth.login(email.value, password.value);
    router.push('/products');
  } catch (e) {
    // VULNERABLE: the backend returns distinct messages (user enumeration).
    error.value = e.message;
  }
}
</script>

<template>
  <div class="card" style="max-width: 420px; margin: 40px auto;">
    <h2>Login</h2>
    <input v-model="email" placeholder="email" />
    <input v-model="password" type="password" placeholder="password" />
    <button @click="submit">Sign in</button>
    <p v-if="error" class="error">{{ error }}</p>
    <p class="muted">
      Test accounts: admin@shopsec.local / Admin123! — alice@shopsec.local / Alice123! —
      bob@shopsec.local / Bob123!
    </p>
  </div>
</template>
