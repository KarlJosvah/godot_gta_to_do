import { ref, computed } from 'vue';
import { API_BASE } from '../config';

const token = ref<string | null>(localStorage.getItem('token'));
const username = ref<string | null>(localStorage.getItem('username'));

export function useAuth() {
  const isLoggedIn = computed(() => !!token.value);

  const login = async (user: string, pass: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass }),
      });
      if (res.ok) {
        const data = await res.json();
        token.value = data.access_token;
        username.value = data.username;
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('username', data.username);
        return true;
      }
    } catch (err) {
      console.error('Login failed:', err);
    }
    return false;
  };

  const logout = () => {
    token.value = null;
    username.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  };

  const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const headers = {
      ...(options.headers || {}),
    } as Record<string, string>;

    if (token.value) {
      headers['Authorization'] = `Bearer ${token.value}`;
    }

    return fetch(url, { ...options, headers });
  };

  return {
    isLoggedIn,
    username,
    login,
    logout,
    authFetch,
  };
}
