import { createRouter, createWebHistory } from 'vue-router';
import ProductsView from '../views/ProductsView.vue';
import ProductDetailView from '../views/ProductDetailView.vue';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import OrdersView from '../views/OrdersView.vue';
import OrderDetailView from '../views/OrderDetailView.vue';
import AdminView from '../views/AdminView.vue';

const routes = [
  { path: '/', redirect: '/products' },
  { path: '/products', component: ProductsView },
  { path: '/products/:id', component: ProductDetailView },
  { path: '/login', component: LoginView },
  { path: '/register', component: RegisterView },
  { path: '/orders', component: OrdersView },
  { path: '/orders/:id', component: OrderDetailView },
  { path: '/admin', component: AdminView },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
