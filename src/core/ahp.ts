// ─── Mesin AHP (Analytic Hierarchy Process) ──────────────────────────────────
//
// PENTING — JANGAN UBAH RUMUS DI BERKAS INI.
// Bobot diturunkan dari matriks perbandingan berpasangan lewat rata-rata
// geometrik (AHP autentik, PPT slide 5), bukan sebaliknya. Dengan matriks
// bawaan, keluarannya: lambdaMax = 5,056 · CI = 0,014 · CR = 0,012.
// Nilai-nilai itu diuji ulang di src/core/__tests__/calc.test.mjs.

import type { Comparisons } from './types'

/** Random Index Saaty, dipakai sebagai penyebut CR. */
export const RI_TABLE: Record<number, number> = {
  1: 0.00, 2: 0.00, 3: 0.58, 4: 0.90, 5: 1.12,
  6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49,
}

export const SAATY_OPTIONS: { value: number; label: string }[] = [
  { value: 9,   label: '9 — Mutlak lebih penting' },
  { value: 8,   label: '8' },
  { value: 7,   label: '7 — Sangat lebih penting' },
  { value: 6,   label: '6' },
  { value: 5,   label: '5 — Lebih penting' },
  { value: 4,   label: '4' },
  { value: 3,   label: '3 — Sedikit lebih penting' },
  { value: 2,   label: '2' },
  { value: 1,   label: '1 — Sama penting' },
  { value: 1/2, label: '1/2' },
  { value: 1/3, label: '1/3 — Sedikit kurang penting' },
  { value: 1/4, label: '1/4' },
  { value: 1/5, label: '1/5 — Kurang penting' },
  { value: 1/6, label: '1/6' },
  { value: 1/7, label: '1/7 — Sangat kurang penting' },
  { value: 1/8, label: '1/8' },
  { value: 1/9, label: '1/9 — Mutlak kurang penting' },
]

/** Tampilkan nilai Saaty sebagai pecahan (0,333 → "1/3"). */
export function fmtSaaty(v: number): string {
  if (v >= 1) return String(Math.round(v))
  for (let d = 2; d <= 9; d++) {
    if (Math.abs(v - 1 / d) < 1e-9) return `1/${d}`
  }
  return v.toFixed(3)
}

/**
 * Cocokkan nilai bebas ke opsi Saaty terdekat.
 * Nilai dari basis data disimpan sebagai desimal (0,333333), sedangkan
 * <select> membandingkan dengan === terhadap 1/3 — tanpa pencocokan ini
 * dropdown akan tampil kosong.
 */
export function nearestSaaty(v: number): number {
  let best = SAATY_OPTIONS[0].value
  let bestDiff = Infinity
  for (const opt of SAATY_OPTIONS) {
    const diff = Math.abs(opt.value - v)
    if (diff < bestDiff) {
      bestDiff = diff
      best = opt.value
    }
  }
  return best
}

export interface AHPResult {
  weights: number[]
  lambdaMax: number
  CI: number
  CR: number | null
}

/**
 * Hitung bobot kriteria, lambdaMax, CI, dan CR dari matriks n×n.
 * Rumus identik dengan prototipe awal.
 */
export function calcAHP(matrix: number[][]): AHPResult {
  const n = matrix.length
  if (n === 0) return { weights: [], lambdaMax: 0, CI: 0, CR: null }

  // Rata-rata geometrik tiap baris
  const gm = matrix.map(row =>
    Math.pow(row.reduce((p, v) => p * v, 1), 1 / n)
  )
  const gmSum = gm.reduce((s, v) => s + v, 0)
  const weights = gm.map(g => g / gmSum)

  // lambdaMax = rata-rata dari (A·w)_i / w_i
  const aw = matrix.map(row =>
    row.reduce((s, v, j) => s + v * weights[j], 0)
  )
  const lambdaMax = aw.reduce((s, v, i) => s + v / weights[i], 0) / n

  const CI = n < 3 ? 0 : (lambdaMax - n) / (n - 1)
  const ri = RI_TABLE[n] ?? 1.49
  const CR = n < 3 ? null : CI / ri

  return { weights, lambdaMax, CI, CR }
}

/**
 * Susun matriks n×n penuh dari segitiga atas.
 * Diagonal = 1, segitiga bawah = resiprokal.
 */
export function buildMatrix(codes: string[], upper: Comparisons): number[][] {
  return codes.map((rowCode, i) =>
    codes.map((colCode, j) => {
      if (i === j) return 1
      if (j > i) return upper[rowCode]?.[colCode] ?? 1
      return 1 / (upper[colCode]?.[rowCode] ?? 1)
    })
  )
}

/** Ambang konsistensi Saaty: penilaian dianggap koheren bila CR <= 0,1. */
export function isConsistent(CR: number | null): boolean {
  return CR === null || CR <= 0.1
}
