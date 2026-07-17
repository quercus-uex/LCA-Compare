import { API_BASE_URL } from './constants.ts';
import { getAuthHeaders } from './auth.ts';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type ApiInit = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
};

const buildHeaders = (init?: ApiInit): Record<string, string> => ({
  'Content-Type': 'application/json',
  ...getAuthHeaders(),
  ...(init?.headers ?? {}),
});

export async function apiRequest(path: string, init?: ApiInit): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: buildHeaders(init),
  });
}

export async function apiFetch<T>(path: string, init?: ApiInit): Promise<T> {
  const res = await apiRequest(path, init);
  if (!res.ok) {
    throw new ApiError(res.status, await res.text().catch(() => res.statusText));
  }
  const json = await res.json();
  return json.data as T;
}

export async function apiFetchRaw<T>(path: string, init?: ApiInit): Promise<T> {
  const res = await apiRequest(path, init);
  if (!res.ok) {
    throw new ApiError(res.status, await res.text().catch(() => res.statusText));
  }
  return (await res.json()) as T;
}