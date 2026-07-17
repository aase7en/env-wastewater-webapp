/** Typed fetch wrapper — hits /api/* (proxied to FastAPI in dev). */

import type {
  DashboardRow,
  EquipmentOut,
  HealthStatus,
  LocationCategoryOut,
  LocationOut,
  PersonnelOut,
  ReadingCreate,
  ReadingDetail,
  ReadingList,
  ReadingUpdate,
} from "./types";

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
  health: () => apiFetch<HealthStatus>("/api/health"),
  dashboard: (days = 14) =>
    apiFetch<DashboardRow[]>(`/api/dashboard?days=${days}`),
  readings: (limit = 30) =>
    apiFetch<ReadingList>(`/api/readings?limit=${limit}`),
  getReading: (id: string) => apiFetch<ReadingDetail>(`/api/readings/${id}`),
  createReading: (body: ReadingCreate) =>
    apiFetch<ReadingDetail>("/api/readings", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateReading: (id: string, body: ReadingUpdate) =>
    apiFetch<ReadingDetail>(`/api/readings/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteReading: (id: string) =>
    apiFetch<void>(`/api/readings/${id}`, { method: "DELETE" }),
  equipment: () => apiFetch<EquipmentOut[]>("/api/equipment"),
  locations: () => apiFetch<LocationOut[]>("/api/locations"),
  locationCategories: () => apiFetch<LocationCategoryOut[]>("/api/location-categories"),
  personnel: () => apiFetch<PersonnelOut[]>("/api/personnel"),
};
