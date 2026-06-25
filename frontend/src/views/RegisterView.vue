<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { auth } from '../store/auth.js';

const username = ref('');
const email = ref('');
const password = ref('');
const error = ref('');
const router = useRouter();

async function submit() {
  error.value = '';
  try {
    // SECURED: no "role" field — the backend always assigns the "user" role.
    await auth.register({
      username: username.value,
      email: email.value,
      password: password.value,
    });
    router.push('/products');
  } catch (e) {
    error.value = e.message;
  }
}
</script>

<template>
  <div class="card" style="max-width: 420px; margin: 40px auto;">
    <h2>Register</h2>
    <input v-model="username" placeholder="username" />
    <input v-model="email" placeholder="email" />
    <input v-model="password" type="password" placeholder="password" />
    <button @click="submit">Create account</button>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>
