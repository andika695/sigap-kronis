// Isi halaman beranda — diambil dari SIGAP-Kronis_Slide_AHP-Autentik.pptx.
// Dipisah dari komponen agar teks mudah disunting tanpa menyentuh markup.

/** Slide 2 — gambaran masalah. */
export const PROBLEM_STATS = [
  { value: '44%',    label: 'Penyakit jantung dipicu hipertensi tak terkontrol' },
  { value: '30%',    label: 'Prevalensi hipertensi pada populasi nasional' },
  { value: '60%',    label: 'Lansia Indonesia mengalami hipertensi' },
  { value: 'Rp19 T', label: 'Biaya penyakit jantung per tahun (2024–2025)' },
]

/** Slide 2 — rantai "loss of follow-up". */
export const GAP_CHAIN = [
  { title: 'Kader cek tensi & gula darah rutin', tone: 'ok' as const },
  { title: 'Data tercatat di kertas / buku',     tone: 'warn' as const },
  { title: 'Tidak ada stratifikasi risiko',      tone: 'bad' as const },
]

/** Slide 3 — alur kerja 6 langkah. */
export const WORKFLOW = [
  'Kader input data pemeriksaan',
  'Sistem hitung skor (AHP → SAW/TOPSIS)',
  'Ranking prioritas penanganan',
  'Dashboard, red flag di atas',
  'Dokter/perawat tindak lanjut',
  'Re-scoring tiap kunjungan baru',
]

/** Slide 3 — tiga metode yang dikombinasikan. */
export const METHODS = [
  {
    tag: 'AHP',
    name: 'Analytic Hierarchy Process',
    desc: 'Menentukan bobot kriteria dari perbandingan berpasangan expert judgment dokter — diuji konsistensinya lewat CR.',
  },
  {
    tag: 'SAW',
    name: 'Simple Additive Weighting',
    desc: 'Menjumlahkan nilai kriteria yang ternormalisasi & terbobot — sederhana, cepat, mudah diaudit tenaga medis.',
  },
  {
    tag: 'TOPSIS',
    name: 'Order Preference by Ideal Solution',
    desc: 'Mengukur jarak tiap pasien ke solusi ideal positif & negatif — tegas memisahkan pasien aman dari red flag.',
  },
]

/** Slide 4 — kriteria penilaian. */
export const CRITERIA_INFO = [
  { code: 'C1', name: 'Tekanan Darah Sistolik',   unit: 'mmHg',      type: 'Cost' },
  { code: 'C2', name: 'Gula Darah Puasa',         unit: 'mg/dL',     type: 'Cost' },
  { code: 'C3', name: 'Usia',                     unit: 'tahun',     type: 'Cost' },
  { code: 'C4', name: 'IMT / BMI',                unit: 'kg/m²',     type: 'Cost' },
  { code: 'C5', name: 'Kepatuhan Kontrol/Obat',   unit: 'skala 1–5', type: 'Benefit' },
]

/** Slide 7 — fitur per peran. */
export const ROLE_FEATURES = [
  {
    role: 'Kader / Posyandu-ILP',
    items: ['Input data pemeriksaan rutin', 'Lihat ranking risiko (read-only)', 'Lihat riwayat tindak lanjut'],
  },
  {
    role: 'Dokter / Perawat',
    items: ['Validasi skor risiko pasien', 'Tambah catatan tindak lanjut', 'Tandai "sudah ditindaklanjuti"'],
  },
  {
    role: 'Kepala Puskesmas / Admin',
    items: ['Kelola kriteria & matriks AHP', 'Kelola pengguna sistem', 'Kelola data pasien (CRUD)'],
  },
]

/** Slide 7 — fitur pendukung. */
export const SUPPORT_FEATURES = [
  'Matriks pairwise editable → bobot & CR otomatis',
  'Notifikasi red flag di dashboard',
  'Radar chart vs rata-rata populasi',
  'Riwayat tindak lanjut per pasien',
  'Auto-increment ID pasien (P0xx)',
  'Toggle tampilan SAW vs SAW+TOPSIS',
]

/** Slide 1 & 9 — identitas kelompok. */
export const TEAM = {
  group: 'Kesatria Naga Hitam',
  members: [
    'Aurel Aldo Givary Prasetyo',
    'W. Andika Aditama',
    'Rifqi Aunnur Rohman',
    'Muhammad Akbar Pratama',
  ],
  course: 'Sistem Cerdas dan Pendukung Keputusan',
  program: 'Informatika / E · Universitas Islam Indonesia',
}
