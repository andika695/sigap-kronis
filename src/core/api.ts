// Klien API — satu-satunya tempat aplikasi bicara dengan backend PHP.

import type { Comparisons, Criteria, Patient, Role, UserAccount } from './types'

/**
 * Alamat dasar API.
 *
 * Dev  : '/api' diteruskan ke Apache lewat proxy di vite.config.ts.
 * Build: berkas ada di /SIGAP-Kronis/dist/ sedangkan API di /SIGAP-Kronis/api/.
 *
 * Harus dihitung dari BASE_URL, bukan ditulis '../api'. Path relatif akan
 * diselesaikan terhadap URL rute yang sedang aktif, sehingga '../api' menjadi
 * benar di /dist/masuk tetapi salah di /dist/app/ranking (jadi /dist/api).
 * Menghitungnya dari BASE_URL membuat hasilnya sama di kedalaman rute mana pun.
 */
const BASE = import.meta.env.DEV
  ? '/api'
  : new URL('../api', new URL(import.meta.env.BASE_URL, window.location.origin)).pathname

/** Error API yang membawa status HTTP dan pesan validasi per field. */
export class ApiError extends Error {
  status: number
  fields: Record<string, string>

  constructor(message: string, status: number, fields: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fields = fields
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: globalThis.Response
  try {
    res = await fetch(`${BASE}${path}`, {
      // Sesi memakai cookie httpOnly, jadi kredensial harus ikut dikirim.
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
  } catch {
    throw new ApiError(
      'Tidak dapat menghubungi server. Pastikan Apache & MySQL di XAMPP sudah berjalan.',
      0
    )
  }

  const text = await res.text()
  let body: any = null
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      throw new ApiError(`Server membalas respons yang tidak valid (HTTP ${res.status}).`, res.status)
    }
  }

  if (!res.ok || !body?.ok) {
    throw new ApiError(
      body?.error ?? `Permintaan gagal (HTTP ${res.status}).`,
      res.status,
      body?.fields ?? {}
    )
  }

  return body.data as T
}

const get  = <T>(p: string) => request<T>(p)
const post = <T>(p: string, body?: unknown) =>
  request<T>(p, { method: 'POST', body: JSON.stringify(body ?? {}) })
const put = <T>(p: string, body?: unknown) =>
  request<T>(p, { method: 'PUT', body: JSON.stringify(body ?? {}) })
const patch = <T>(p: string, body?: unknown) =>
  request<T>(p, { method: 'PATCH', body: JSON.stringify(body ?? {}) })
const del = <T>(p: string) => request<T>(p, { method: 'DELETE' })

// ── Auth ────────────────────────────────────────────────────────────────
export const authApi = {
  me:       ()                                   => get<{ user: UserAccount | null }>('/auth/me'),
  login:    (username: string, password: string) => post<{ user: UserAccount }>('/auth/login', { username, password }),
  logout:   ()                                   => post<{ message: string }>('/auth/logout'),
  register: (payload: {
    name: string; username: string; email: string; password: string; role: Role
  }) => post<{ user: UserAccount }>('/auth/register', payload),
  forgot:   (email: string) => post<{ message: string; demo_token?: string; note?: string }>('/auth/forgot', { email }),
  reset:    (token: string, password: string) => post<{ message: string }>('/auth/reset', { token, password }),
}

// ── Kriteria & AHP ──────────────────────────────────────────────────────
export interface CriteriaPayload {
  criteria: Omit<Criteria, 'weight'>[]
  comparisons: Comparisons
}

export const criteriaApi = {
  list:   ()                                  => get<CriteriaPayload>('/criteria'),
  add:    (payload: Partial<Criteria>)        => post<CriteriaPayload>('/criteria', payload),
  update: (id: number, payload: Partial<Criteria>) => put<CriteriaPayload>(`/criteria/${id}`, payload),
  remove: (id: number)                        => del<CriteriaPayload>(`/criteria/${id}`),
  setPair: (row: string, col: string, value: number) => put<CriteriaPayload>('/ahp', { row, col, value }),
}

// ── Pasien ──────────────────────────────────────────────────────────────
export const patientsApi = {
  list:   ()                        => get<{ patients: Patient[] }>('/patients'),
  create: (name: string, values: Record<string, number>) =>
    post<{ patient: Patient }>('/patients', { name, values }),
  update: (id: number, payload: { name: string; values: Record<string, number>; prevSaw?: number; prevTopsis?: number }) =>
    put<{ patient: Patient }>(`/patients/${id}`, payload),
  remove: (id: number)              => del<{ message: string }>(`/patients/${id}`),
  toggleFollowUp: (id: number, tindaklanjuti: boolean) =>
    patch<{ patient: Patient }>(`/patients/${id}/tindaklanjuti`, { tindaklanjuti }),
  addNote: (id: number, note: string) =>
    post<{ patient: Patient }>(`/patients/${id}/followups`, { note }),
}

// ── Pengguna ────────────────────────────────────────────────────────────
export const usersApi = {
  list:   ()                     => get<{ users: UserAccount[] }>('/users'),
  create: (payload: { name: string; username: string; email: string; password: string; role: Role }) =>
    post<{ user: UserAccount }>('/users', payload),
  setActive: (id: number, active: boolean) =>
    patch<{ user: UserAccount }>(`/users/${id}/active`, { active }),
  remove: (id: number)           => del<{ message: string }>(`/users/${id}`),
}
