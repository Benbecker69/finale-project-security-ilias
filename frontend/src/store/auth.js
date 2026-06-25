import { reactive } from 'vue';
import { api } from '../api/client.js';

// VULNERABLE: token persisted in localStorage (readable by any injected script).
export const auth = reactive({
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),

  get isLoggedIn() {
    return !!this.token;
  },
  get isAdmin() {
    return this.user?.role === 'admin';
  },

  async login(email, password) {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this._persist(data);
    return data;
  },

  async register(payload) {
    const data = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this._persist(data);
    return data;
  },

  _persist(data) {
    this.token = data.token;
    this.user = data.user;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  },

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
});
