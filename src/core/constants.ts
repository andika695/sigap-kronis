// Palet & label bersama.

import type { Risk, Role } from './types'

/** Warna utama — biru medis (PPT). */
export const BRAND = '#0F5C7A'
export const BRAND_DARK = '#0a3d52'

export const RISK_COLOR: Record<Risk, string> = {
  'Kurang Penting': '#16A34A',
  'Cukup Penting':  '#FBBF24',
  'Sangat Penting': '#F59E0B',
  'Paling Penting': '#DC2626',
}

/** Kelas Tailwind untuk badge kategori. */
export const RISK_BG: Record<Risk, string> = {
  'Kurang Penting': 'bg-green-100 text-green-800 ring-green-200',
  'Cukup Penting':  'bg-yellow-100 text-yellow-800 ring-yellow-200',
  'Sangat Penting': 'bg-orange-100 text-orange-800 ring-orange-200',
  'Paling Penting': 'bg-red-100 text-red-800 ring-red-200',
}

export const RISK_ORDER: Risk[] = [
  'Kurang Penting',
  'Cukup Penting',
  'Sangat Penting',
  'Paling Penting',
]

export const ROLE_LABEL: Record<Role, string> = {
  kader:  'Kader',
  dokter: 'Dokter/Perawat',
  admin:  'Admin',
}

/** Rekomendasi tindak lanjut per kategori (Detail Pasien). */
export const RECOMMENDATION: Record<Risk, { bg: string; text: string; msg: string }> = {
  'Kurang Penting': {
    bg: 'bg-green-50 border-green-200',
    text: 'text-green-800',
    msg: 'Kondisi pasien terkontrol dengan baik. Jadwalkan kunjungan rutin 3 bulan ke depan.',
  },
  'Cukup Penting': {
    bg: 'bg-yellow-50 border-yellow-200',
    text: 'text-yellow-900',
    msg: 'Perlu perhatian. Edukasi gaya hidup dan pantau nilai-nilai kritikal pada kunjungan berikutnya.',
  },
  'Sangat Penting': {
    bg: 'bg-orange-50 border-orange-200',
    text: 'text-orange-900',
    msg: 'Prioritas tinggi. Pertimbangkan penyesuaian terapi dan jadwalkan konsultasi segera.',
  },
  'Paling Penting': {
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-900',
    msg: 'Prioritas utama: pasien membutuhkan intervensi segera. Hubungi dokter untuk evaluasi mendesak.',
  },
}
