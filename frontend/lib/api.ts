const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const UPLOAD_BASE = API_BASE + '/uploads';

const TOKEN_KEY = 'mini-board-token';
const REFRESH_KEY = 'mini-board-refresh';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  const refreshToken = typeof window !== 'undefined' ? localStorage.getItem(REFRESH_KEY) : null;
  if (!refreshToken) return null;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        throw new Error('Refresh failed');
      }
      const data = await res.json();
      localStorage.setItem(TOKEN_KEY, data.accessToken);
      localStorage.setItem(REFRESH_KEY, data.refreshToken);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('auth-token-updated', { detail: data.accessToken })
        );
      }
      return data.accessToken;
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth-logout'));
      }
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

function isAuthPath(path: string): boolean {
  return path.startsWith('/auth/');
}

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string; _retry?: boolean } = {}
): Promise<T> {
  const { token, _retry, ...init } = options;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  const accessToken = token ?? getToken();
  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (res.status === 401 && accessToken && !isAuthPath(path) && !_retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return api<T>(path, { ...options, token: newToken, _retry: true });
    }
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }
  return res.json();
}

export async function apiFormData<T>(
  path: string,
  formData: FormData,
  token?: string,
  retry = false
): Promise<T> {
  const headers: HeadersInit = {};
  const accessToken = token ?? getToken();
  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    body: formData,
    headers,
  });
  if (res.status === 401 && accessToken && !isAuthPath(path) && !retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFormData<T>(path, formData, newToken, true);
    }
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }
  return res.json();
}
