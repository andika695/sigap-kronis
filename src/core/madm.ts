// ─── Mesin MADM: SAW + TOPSIS ────────────────────────────────────────────────
//
// PENTING — JANGAN UBAH RUMUS DI BERKAS INI.
// Rumus normalisasi, pembobotan, solusi ideal, jarak Euclidean, dan Vi
// dipertahankan persis seperti prototipe awal. Yang digeneralisasi hanya
// pengambilan kolom: dulu di-hardcode c1..c5, kini mengikuti daftar kriteria
// dari basis data supaya "Tambah Kriteria" di Panel Admin ikut terhitung.

import type { Criteria, Patient, Risk, ScoreResult } from './types'

/**
 * Kategori berdasarkan AMBANG Vi — sesuai PPT slide 6.
 * Dipakai sebagai badge utama di tabel Ranking.
 */
export function riskByVi(vi: number): Risk {
  if (vi >= 0.75) return 'Kurang Penting'
  if (vi >= 0.50) return 'Cukup Penting'
  if (vi >= 0.25) return 'Sangat Penting'
  return 'Paling Penting'
}

/**
 * Kategori berdasarkan KUARTIL PERINGKAT — logika prototipe awal.
 * Selalu membagi pasien ke empat kelompok seukuran, apa pun besaran Vi-nya.
 * Ditampilkan berdampingan sebagai pembanding.
 */
export function riskByQuartile(rank: number, n: number): Risk {
  const pct = rank / n
  if (pct <= 0.25) return 'Paling Penting'
  if (pct <= 0.50) return 'Sangat Penting'
  if (pct <= 0.75) return 'Cukup Penting'
  return 'Kurang Penting'
}

/** Ambang Vi untuk catatan di bawah tabel Ranking. */
export const VI_BANDS: { risk: Risk; label: string }[] = [
  { risk: 'Kurang Penting',  label: 'Vi ≥ 0,75' },
  { risk: 'Cukup Penting',   label: '0,50 ≤ Vi < 0,75' },
  { risk: 'Sangat Penting',  label: '0,25 ≤ Vi < 0,50' },
  { risk: 'Paling Penting',  label: 'Vi < 0,25' },
]

/**
 * Hitung skor SAW & TOPSIS untuk seluruh pasien.
 * Perbandingan bersifat relatif: skor tiap pasien bergantung pada min/max
 * seluruh populasi, sehingga menambah pasien baru dapat menggeser skor pasien
 * lama (keterbatasan model yang dibahas di PPT slide 8, bukan bug).
 */
export function calcScores(patients: Patient[], criteria: Criteria[]): ScoreResult[] {
  if (patients.length < 2 || criteria.length === 0) {
    return patients.map((p, i) => ({
      id: p.id,
      code: p.code,
      saw: 0,
      topsis: 0,
      risk: 'Cukup Penting' as Risk,
      riskQuartile: 'Cukup Penting' as Risk,
      rank: i + 1,
    }))
  }

  // Satu kolom nilai per kriteria, urut mengikuti urutan pasien.
  const cols: number[][] = criteria.map(c => patients.map(p => p.values[c.code] ?? 0))

  // ── SAW ────────────────────────────────────────────────────────────────
  // cost    : min(kolom) / nilai
  // benefit : nilai / max(kolom)
  const sawNorm = patients.map((_, i) =>
    criteria.map((c, ci) => {
      const col = cols[ci]
      if (c.type === 'cost') return Math.min(...col) / col[i]
      else return col[i] / Math.max(...col)
    })
  )
  const sawScores = sawNorm.map(row =>
    row.reduce((sum, val, ci) => sum + val * criteria[ci].weight, 0)
  )

  // ── TOPSIS ─────────────────────────────────────────────────────────────
  // rij = xij / sqrt(sum xij²)
  const topsisNorm = criteria.map((_, ci) => {
    const col = cols[ci]
    const denom = Math.sqrt(col.reduce((s, v) => s + v * v, 0))
    return col.map(v => v / denom)
  })

  // yij = rij × bobot
  const weighted = criteria.map((c, ci) =>
    topsisNorm[ci].map(v => v * c.weight)
  )

  // A+ : cost → min, benefit → max ; A- : kebalikannya
  const aPlus = criteria.map((c, ci) => {
    const col = weighted[ci]
    return c.type === 'cost' ? Math.min(...col) : Math.max(...col)
  })
  const aMinus = criteria.map((c, ci) => {
    const col = weighted[ci]
    return c.type === 'cost' ? Math.max(...col) : Math.min(...col)
  })

  // Jarak Euclidean ke solusi ideal positif & negatif
  const dPlus = patients.map((_, i) =>
    Math.sqrt(criteria.reduce((s, _c, ci) => s + Math.pow(weighted[ci][i] - aPlus[ci], 2), 0))
  )
  const dMinus = patients.map((_, i) =>
    Math.sqrt(criteria.reduce((s, _c, ci) => s + Math.pow(weighted[ci][i] - aMinus[ci], 2), 0))
  )

  // Vi = D- / (D+ + D-)
  const vi = patients.map((_, i) => dMinus[i] / (dPlus[i] + dMinus[i]))

  // Urut Vi menaik → peringkat 1 = Vi terendah = prioritas penanganan tertinggi
  const sorted = patients
    .map((p, i) => ({ id: p.id, code: p.code, saw: sawScores[i], topsis: vi[i] }))
    .sort((a, b) => a.topsis - b.topsis)

  const n = sorted.length
  return sorted.map((r, i) => ({
    ...r,
    rank: i + 1,
    risk: riskByVi(r.topsis),
    riskQuartile: riskByQuartile(i + 1, n),
  }))
}
