/** Typed fetch wrapper — hits /api/* (proxied to FastAPI in dev). */

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => resp.statusText);
    throw new Error(`${resp.status} ${resp.statusText}: ${detail}`);
  }
  // 204 No Content
  if (resp.status === 204) return undefined as T;
  return resp.json() as Promise<T>;
}

export const api = {
  health: () => apiFetch<import("./types").HealthStatus>("/api/health"),
  dashboard: (days = 14) =>
    apiFetch<import("./types").DashboardRow[]>(`/api/dashboard?days=${days}`),
  readings: (limit = 30) =>
    apiFetch<import("./types").ReadingList>(`/api/readings?limit=${limit}`),
  equipment: () =>
    apiFetch<import("./types").EquipmentOut[]>("/api/equipment"),
};
