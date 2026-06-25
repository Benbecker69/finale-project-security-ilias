const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// VULNERABLE: the JWT is read from localStorage. Any XSS (see the stored XSS on
// product reviews) can steal it via document/localStorage access.
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
