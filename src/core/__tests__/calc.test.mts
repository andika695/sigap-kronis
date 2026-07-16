/**
 * Uji regresi mesin perhitungan terhadap angka resmi di PPT
 * (SIGAP-Kronis_Slide_AHP-Autentik.pptx, slide 4-6).
 *
 * Tujuannya menjaga agar refactor tidak pernah menggeser hasil AHP/SAW/TOPSIS.
 *
 * Jalankan:  npm test
 */

import assert from 'node:assert/strict'
import test from 'node:test'

import { buildMatrix, calcAHP, isConsistent, nearestSaaty } from '../ahp.ts'
import { calcScores, riskByQuartile, riskByVi } from '../madm.ts'
import type { Criteria, Patient } from '../types.ts'

// ── Data uji: persis seperti PPT ────────────────────────────────────────
const CODES = ['C1', 'C2', 'C3', 'C4', 'C5']

// Segitiga atas matriks perbandingan berpasangan (slide 5)
const COMPARISONS = {
  C1: { C2: 1, C3: 5, C4: 5, C5: 3 },
  C2: { C3: 5, C4: 5, C5: 3 },
  C3: { C4: 1, C5: 1 / 3 },
  C4: { C5: 1 / 3 },
}

const META: Omit<Criteria, 'weight'>[] = [
  { id: 1, code: 'C1', name: 'Tekanan Darah Sistolik', unit: 'mmHg',      type: 'cost',    minValue: 60, maxValue: 250, position: 1 },
  { id: 2, code: 'C2', name: 'Gula Darah Puasa',       unit: 'mg/dL',     type: 'cost',    minValue: 50, maxValue: 600, position: 2 },
  { id: 3, code: 'C3', name: 'Usia',                   unit: 'tahun',     type: 'cost',    minValue: 1,  maxValue: 120, position: 3 },
  { id: 4, code: 'C4', name: 'IMT/BMI',                unit: 'kg/m²',     type: 'cost',    minValue: 10, maxValue: 60,  position: 4 },
  { id: 5, code: 'C5', name: 'Kepatuhan Kontrol',      unit: 'skala 1-5', type: 'benefit', minValue: 1,  maxValue: 5,   position: 5 },
]

// 5 pasien uji coba (slide 4)
const PATIENTS: Patient[] = [
  { id: 1, code: 'P001', name: 'Bu Sari',    values: { C1: 165, C2: 210, C3: 62, C4: 29, C5: 2 }, tindaklanjuti: false, prevSaw: null, prevTopsis: null, followUps: [] },
  { id: 2, code: 'P002', name: 'Pak Joko',   values: { C1: 130, C2: 110, C3: 45, C4: 23, C5: 4 }, tindaklanjuti: false, prevSaw: null, prevTopsis: null, followUps: [] },
  { id: 3, code: 'P003', name: 'Bu Wati',    values: { C1: 150, C2: 180, C3: 55, C4: 27, C5: 3 }, tindaklanjuti: false, prevSaw: null, prevTopsis: null, followUps: [] },
  { id: 4, code: 'P004', name: 'Pak Slamet', values: { C1: 120, C2: 95,  C3: 38, C4: 21, C5: 5 }, tindaklanjuti: false, prevSaw: null, prevTopsis: null, followUps: [] },
  { id: 5, code: 'P005', name: 'Bu Ningsih', values: { C1: 175, C2: 230, C3: 68, C4: 31, C5: 1 }, tindaklanjuti: false, prevSaw: null, prevTopsis: null, followUps: [] },
]

const ahp = calcAHP(buildMatrix(CODES, COMPARISONS))
const criteria: Criteria[] = META.map((m, i) => ({ ...m, weight: ahp.weights[i] }))
const scores = calcScores(PATIENTS, criteria)
const byCode = (code: string) => scores.find(s => s.code === code)!
const nameOf = (code: string) => PATIENTS.find(p => p.code === code)!.name

// ── AHP ─────────────────────────────────────────────────────────────────

test('AHP: lambdaMax, CI, dan CR sama dengan PPT slide 5', () => {
  // PPT: lambdaMax=5,056 · CI=0,014 · CR=0,012.
  // Mesin ini memakai pecahan eksak (1/3, 1/5) sehingga menghasilkan
  // lambdaMax=5,055496 — PPT tampaknya menghitung dari desimal yang sudah
  // dibulatkan (0,333 / 0,2). Selisihnya ~0,0005, jadi toleransi 1e-3.
  assert.ok(Math.abs(ahp.lambdaMax - 5.056) < 1e-3, `lambdaMax=${ahp.lambdaMax}`)
  assert.ok(Math.abs(ahp.CI - 0.014) < 1e-3, `CI=${ahp.CI}`)
  assert.ok(Math.abs(ahp.CR! - 0.012) < 1e-3, `CR=${ahp.CR}`)
})

test('AHP: nilai eksak mesin terkunci (deteksi perubahan rumus tak disengaja)', () => {
  assert.equal(ahp.lambdaMax.toFixed(4), '5.0555')
  assert.equal(ahp.CI.toFixed(4), '0.0139')
  assert.equal(ahp.CR!.toFixed(4), '0.0124')
  assert.deepEqual(
    ahp.weights.map(w => w.toFixed(4)),
    ['0.3601', '0.3601', '0.0640', '0.0640', '0.1518']
  )
})

test('AHP: penilaian expert dinyatakan konsisten (CR <= 0,1)', () => {
  assert.ok(isConsistent(ahp.CR))
})

test('AHP: bobot berjumlah 1 dan C1 = C2 (dinilai sama penting)', () => {
  const total = ahp.weights.reduce((s, w) => s + w, 0)
  assert.ok(Math.abs(total - 1) < 1e-9, `total=${total}`)
  assert.ok(Math.abs(ahp.weights[0] - ahp.weights[1]) < 1e-9)
  assert.ok(Math.abs(ahp.weights[2] - ahp.weights[3]) < 1e-9)
})

test('AHP: urutan kepentingan bobot C1=C2 > C5 > C3=C4', () => {
  const [w1, w2, w3, w4, w5] = ahp.weights
  assert.ok(w1 > w5 && w2 > w5, 'tensi & gula darah harus di atas kepatuhan')
  assert.ok(w5 > w3 && w5 > w4, 'kepatuhan harus di atas usia & BMI')
})

test('AHP: matriks resiprokal & diagonal = 1', () => {
  const m = buildMatrix(CODES, COMPARISONS)
  for (let i = 0; i < m.length; i++) {
    assert.equal(m[i][i], 1)
    for (let j = 0; j < m.length; j++) {
      assert.ok(Math.abs(m[i][j] * m[j][i] - 1) < 1e-9, `sel ${i},${j} tidak resiprokal`)
    }
  }
})

test('AHP: nearestSaaty memetakan desimal basis data ke opsi dropdown', () => {
  assert.ok(Math.abs(nearestSaaty(0.333333) - 1 / 3) < 1e-9)
  assert.equal(nearestSaaty(5), 5)
  assert.equal(nearestSaaty(0.99), 1)
})

// ── Perankingan ─────────────────────────────────────────────────────────

test('Ranking: urutan identik dengan PPT slide 6 (Slamet > Joko > Wati > Sari > Ningsih)', () => {
  const order = [...scores].sort((a, b) => a.rank - b.rank).map(s => nameOf(s.code))
  assert.deepEqual(order, ['Bu Ningsih', 'Bu Sari', 'Bu Wati', 'Pak Joko', 'Pak Slamet'])
})

test('Ranking: Vi terendah mendapat peringkat 1 (prioritas tertinggi)', () => {
  const sorted = [...scores].sort((a, b) => a.rank - b.rank)
  for (let i = 1; i < sorted.length; i++) {
    assert.ok(sorted[i - 1].topsis <= sorted[i].topsis, 'Vi harus menaik seiring peringkat')
  }
})

test('Ranking: Vi selalu berada di rentang 0..1', () => {
  for (const s of scores) {
    assert.ok(s.topsis >= 0 && s.topsis <= 1, `${s.code} Vi=${s.topsis}`)
  }
})

test('SAW: Pak Slamet ternormalisasi sempurna (semua kriteria terbaik → 1,0)', () => {
  assert.ok(Math.abs(byCode('P004').saw - 1) < 1e-9)
})

// ── Kategori: ambang Vi (badge utama) ───────────────────────────────────

test('Kategori ambang Vi: sama persis dengan tabel PPT slide 6', () => {
  assert.equal(byCode('P004').risk, 'Kurang Penting')  // Pak Slamet
  assert.equal(byCode('P002').risk, 'Kurang Penting')  // Pak Joko
  assert.equal(byCode('P003').risk, 'Sangat Penting')  // Bu Wati
  assert.equal(byCode('P001').risk, 'Paling Penting')  // Bu Sari
  assert.equal(byCode('P005').risk, 'Paling Penting')  // Bu Ningsih
})

test('Kategori ambang Vi: batas-batas band tepat', () => {
  assert.equal(riskByVi(1),     'Kurang Penting')
  assert.equal(riskByVi(0.75),  'Kurang Penting')
  assert.equal(riskByVi(0.749), 'Cukup Penting')
  assert.equal(riskByVi(0.50),  'Cukup Penting')
  assert.equal(riskByVi(0.499), 'Sangat Penting')
  assert.equal(riskByVi(0.25),  'Sangat Penting')
  assert.equal(riskByVi(0.249), 'Paling Penting')
  assert.equal(riskByVi(0),     'Paling Penting')
})

// ── Kategori: kuartil peringkat (logika asli, kolom pembanding) ─────────

test('Kategori kuartil: logika prototipe awal dipertahankan', () => {
  assert.equal(riskByQuartile(1, 5), 'Paling Penting')
  assert.equal(riskByQuartile(2, 5), 'Sangat Penting')
  assert.equal(riskByQuartile(3, 5), 'Cukup Penting')
  assert.equal(riskByQuartile(4, 5), 'Kurang Penting')
  assert.equal(riskByQuartile(5, 5), 'Kurang Penting')
})

test('Kategori: kedua metode sepakat untuk Ningsih, Joko, Slamet — beda untuk Sari & Wati', () => {
  // Perbedaan ini disengaja dan ditampilkan berdampingan di tabel Ranking.
  assert.equal(byCode('P005').risk, byCode('P005').riskQuartile)
  assert.equal(byCode('P002').risk, byCode('P002').riskQuartile)
  assert.equal(byCode('P004').risk, byCode('P004').riskQuartile)
  assert.notEqual(byCode('P001').risk, byCode('P001').riskQuartile)
  assert.notEqual(byCode('P003').risk, byCode('P003').riskQuartile)
})

// ── Kasus tepi ──────────────────────────────────────────────────────────

test('Edge: kurang dari 2 pasien tidak dihitung (perbandingan bersifat relatif)', () => {
  assert.deepEqual(calcScores([], criteria), [])
  const one = calcScores([PATIENTS[0]], criteria)
  assert.equal(one.length, 1)
  assert.equal(one[0].saw, 0)
})

test('Edge: menambah pasien menggeser skor pasien lama (keterbatasan skor relatif, slide 8)', () => {
  const rahman: Patient = {
    id: 6, code: 'P006', name: 'Rahman',
    values: { C1: 110, C2: 90, C3: 30, C4: 20, C5: 5 },
    tindaklanjuti: false, prevSaw: null, prevTopsis: null, followUps: [],
  }
  const after = calcScores([...PATIENTS, rahman], criteria)
  const slametAfter = after.find(s => s.code === 'P004')!
  // Sebelumnya Vi Pak Slamet = 1,000; setelah ada pasien lebih sehat, turun.
  assert.ok(slametAfter.topsis < 1, `Vi Slamet setelah Rahman = ${slametAfter.topsis}`)
})

test('Edge: kriteria tambahan ikut terhitung (dulu c1..c5 di-hardcode)', () => {
  const extra: Criteria = {
    id: 6, code: 'C6', name: 'Kriteria Baru', unit: '', type: 'cost',
    minValue: 0, maxValue: 10, position: 6, weight: 0.1,
  }
  const patients = PATIENTS.map((p, i) => ({ ...p, values: { ...p.values, C6: i + 1 } }))
  const res = calcScores(patients, [...criteria, extra])
  assert.equal(res.length, 5)
  for (const s of res) {
    assert.ok(Number.isFinite(s.saw) && Number.isFinite(s.topsis), `${s.code} menghasilkan NaN`)
  }
})
