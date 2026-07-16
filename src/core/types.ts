// Tipe data bersama untuk seluruh aplikasi SIGAP-Kronis.

export type Role = 'kader' | 'dokter' | 'admin'

/** Kategori prioritas penanganan (urut dari paling aman ke paling mendesak). */
export type Risk =
  | 'Kurang Penting'
  | 'Cukup Penting'
  | 'Sangat Penting'
  | 'Paling Penting'

export interface Criteria {
  id: number
  code: string          // C1, C2, ...
  name: string
  unit: string
  type: 'cost' | 'benefit'
  minValue: number
  maxValue: number
  position: number
  /** Diturunkan dari matriks AHP — tidak pernah disimpan di basis data. */
  weight: number
}

export interface FollowUp {
  id: number
  author: string
  role: Role
  note: string
  date: string
}

export interface Patient {
  id: number
  code: string          // P001, P002, ...
  name: string
  /** Nilai per kode kriteria, mis. { C1: 165, C2: 210, ... } */
  values: Record<string, number>
  tindaklanjuti: boolean
  prevSaw: number | null
  prevTopsis: number | null
  followUps: FollowUp[]
}

export interface UserAccount {
  id: number
  code: string
  name: string
  username: string
  email: string
  role: Role
  active: boolean
}

export interface ScoreResult {
  id: number
  code: string
  saw: number
  /** Skor preferensi TOPSIS (Vi). */
  topsis: number
  /** Kategori berdasarkan ambang Vi — sesuai PPT slide 6. Dipakai sebagai badge utama. */
  risk: Risk
  /** Kategori berdasarkan kuartil peringkat — logika asli, ditampilkan sebagai pembanding. */
  riskQuartile: Risk
  /** Peringkat 1 = Vi terendah = prioritas penanganan tertinggi. */
  rank: number
}

/** Segitiga atas matriks perbandingan berpasangan: { C1: { C2: 1, C3: 5 } }. */
export type Comparisons = Record<string, Record<string, number>>
