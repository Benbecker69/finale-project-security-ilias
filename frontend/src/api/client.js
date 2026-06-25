const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// NOTE: the JWT is kept in localStorage for simplicity. The stored XSS that made this
// dangerous is fixed (text rendering + CSP) and tokens now expire. A further hardening
// step (documented in SECURITY_AUDIT.md §9) is to move to an HttpOnly cookie + CSRF.
function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function api(path, options = {}) {
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    throw Object.assign(new Error((data && data.error) || 'Request failed'), {
      status: res.status,
      data,
    });
  }
  return data;
}

export { BASE };
