// In-memory token store — never written to localStorage
let _token: string | null = null;

export function setToken(t: string | null) {
  _token = t;
}

export function getToken(): string | null {
  return _token;
}

const NODE_BASE = 'https://spl-node-api.onrender.com/api/v1';
// const NODE_BASE = 'http://localhost:3000/api/v1'
// const ANALYTICS_BASE = 'https://your-django-url.onrender.com';

async function request<T>(
  path: string,
  options: RequestInit = {},
  base = NODE_BASE,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (_token) {
    headers['Authorization'] = `Bearer ${_token}`;
  }
  const res = await fetch(`${base}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? res.statusText);
  }
  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export default request;
