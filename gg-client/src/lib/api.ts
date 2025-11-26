// API base URL for the backend
// Prefer explicit base when provided (works for dev/prod), otherwise
// fall back to client Worker proxy in production and localhost in dev.
export const API_BASE = ((import.meta.env.VITE_API_BASE as string) || '').replace(/\/$/, '') || (import.meta.env.PROD ? '/api' : 'http://localhost:8787')

export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {})
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers, credentials: 'include' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res
}
