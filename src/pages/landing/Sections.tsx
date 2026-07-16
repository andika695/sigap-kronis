import type { ReactNode } from 'react'
import { ArrowRight, Check, FileWarning, HeartPulse, TrendingDown } from 'lucide-react'
import {
  CRITERIA_INFO, GAP_CHAIN, METHODS, PROBLEM_STATS,
  ROLE_FEATURES, SUPPORT_FEATURES, WORKFLOW,
} from './data'

/** Judul bagian yang seragam. */
function SectionHead({ eyebrow, title, desc }: { eyebrow: string; title: string; desc?: string }) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">{eyebrow}</span>
      <h2 className="mt-2.5 text-2xl font-extrabold text-slate-900 sm:text-3xl">{title}</h2>
      {desc && <p className="mt-3 text-sm leading-relaxed text-slate-500 sm:text-base">{desc}</p>}
    </div>
  )
}

function Section({ id, children, className = '' }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20 ${className}`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  )
}

// ── Slide 2: Masalah ────────────────────────────────────────────────────
export function ProblemSection() {
  const TONE = {
    ok:   { ring: 'ring-slate-200',  dot: 'bg-slate-300',  icon: <HeartPulse size={16} className="text-slate-400" /> },
    warn: { ring: 'ring-amber-200',  dot: 'bg-amber-400',  icon: <FileWarning size={16} className="text-amber-500" /> },
    bad:  { ring: 'ring-red-200',    dot: 'bg-red-500',    icon: <TrendingDown size={16} className="text-red-500" /> },
  }

  return (
    <Section id="masalah" className="bg-slate-50">
      <SectionHead
        eyebrow="Gambaran Umum · Masalah"
        title="Hipertensi & Diabetes: Akar Penyakit Katastropik"
        desc="Data pemeriksaan rutin sudah ada di Puskesmas — yang belum ada adalah tindak lanjut yang terarah."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {PROBLEM_STATS.map(s => (
          <div
            key={s.label}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="font-display text-3xl font-extrabold text-brand-600 sm:text-4xl">{s.value}</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Rantai loss of follow-up */}
      <div className="mt-10 rounded-2xl border border-slate-100 bg-white p-6 sm:p-8">
        <p className="mb-5 text-sm font-bold text-slate-800">
          Loss of follow-up — data ada, tindak lanjut tidak ada:
        </p>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          {GAP_CHAIN.map((g, i) => (
            <div key={g.title} className="flex flex-1 items-center gap-3">
              <div className={`flex-1 rounded-xl bg-slate-50 px-4 py-3.5 ring-1 ${TONE[g.tone].ring}`}>
                <div className="flex items-center gap-2.5">
                  {TONE[g.tone].icon}
                  <span className="text-xs font-medium leading-snug text-slate-700">{g.title}</span>
                </div>
              </div>
              {i < GAP_CHAIN.length - 1 && (
                <ArrowRight size={16} className="hidden flex-shrink-0 text-slate-300 sm:block" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50 px-5 py-4">
          <p className="text-sm leading-relaxed text-brand-900">
            <strong className="font-bold">SIGAP-Kronis menutup celah ini</strong> lewat skoring &amp;
            dashboard prioritas otomatis, sehingga intervensi jelas dan terukur.
          </p>
        </div>

        <p className="mt-4 text-[11px] text-slate-400">
          Sumber: Kuliah pakar dr. Riana Rahmawati, Dokter Umum FK UII.
        </p>
      </div>
    </Section>
  )
}

// ── Slide 3: Metode & alur ──────────────────────────────────────────────
export function MethodSection() {
  return (
    <Section id="metode">
      <SectionHead
        eyebrow="Gambaran Umum · Solusi & Metode"
        title="Alur Kerja & Kombinasi Metode"
        desc="AHP memberi bobot objektif; SAW & TOPSIS dijalankan berdampingan sebagai validasi silang."
      />

      {/* Alur 6 langkah */}
      <ol className="mb-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {WORKFLOW.map((w, i) => (
          <li
            key={w}
            className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
          >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
              {i + 1}
            </span>
            <span className="text-sm font-medium leading-snug text-slate-700">{w}</span>
          </li>
        ))}
      </ol>

      {/* Tiga metode */}
      <div className="grid gap-4 md:grid-cols-3">
        {METHODS.map(m => (
          <div
            key={m.tag}
            className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <span className="inline-block rounded-lg bg-brand-600 px-3 py-1 font-display text-sm font-extrabold text-white">
              {m.tag}
            </span>
            <h3 className="mt-3.5 text-sm font-bold text-slate-900">{m.name}</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">{m.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
        <p className="text-xs leading-relaxed text-slate-600">
          <strong className="font-bold text-slate-800">Alasan kombinasi:</strong> AHP memberi bobot
          objektif; SAW &amp; TOPSIS dijalankan berdampingan sebagai validasi silang — bila keduanya
          sepakat, keputusan lebih tepercaya.
        </p>
      </div>
    </Section>
  )
}

// ── Slide 4 & 5: Model ──────────────────────────────────────────────────
export function ModelSection() {
  return (
    <Section id="model" className="bg-slate-50">
      <SectionHead
        eyebrow="Model MADM · Input & Pembobotan"
        title="Kriteria Penilaian & Bobot AHP Autentik"
        desc="Bobot diturunkan dari matriks perbandingan berpasangan (rata-rata geometrik) — bukan ditetapkan lebih dulu."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Kriteria */}
        {/* min-w-0: item grid default-nya min-width:auto, sehingga menolak menyusut
            di bawah lebar tabel dan mendorong halaman melebar. Tanpa ini,
            overflow-x-auto di dalamnya tidak pernah aktif. */}
        <div className="min-w-0 rounded-2xl border border-slate-100 bg-white p-6 lg:col-span-3">
          <h3 className="mb-4 text-sm font-bold text-slate-800">5 Atribut Klinis</h3>
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-2 py-2 text-left font-semibold">Kode</th>
                  <th className="px-2 py-2 text-left font-semibold">Kriteria</th>
                  <th className="px-2 py-2 text-left font-semibold">Satuan</th>
                  <th className="px-2 py-2 text-right font-semibold">Tipe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {CRITERIA_INFO.map(c => (
                  <tr key={c.code}>
                    <td className="px-2 py-2.5 font-mono text-xs font-bold text-brand-600">{c.code}</td>
                    <td className="px-2 py-2.5 text-slate-700">{c.name}</td>
                    <td className="px-2 py-2.5 text-xs text-slate-400">{c.unit}</td>
                    <td className="px-2 py-2.5 text-right">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          c.type === 'Cost' ? 'bg-slate-100 text-slate-600' : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {c.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-400">
            <strong className="text-slate-600">Cost</strong> — makin rendah makin aman.{' '}
            <strong className="text-slate-600">Benefit</strong> — makin tinggi makin baik. Mengacu
            pedoman ADA Standards of Care untuk diabetes.
          </p>
        </div>

        {/* Konsistensi */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 lg:col-span-2">
          <h3 className="mb-4 text-sm font-bold text-slate-800">Uji Konsistensi</h3>
          <div className="space-y-3">
            {[
              { k: 'λmax', v: '5,056' },
              { k: 'CI',   v: '0,014' },
              { k: 'CR',   v: '0,012' },
            ].map(x => (
              <div key={x.k} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="font-mono text-xs font-semibold text-slate-500">{x.k}</span>
                <span className="font-display text-lg font-extrabold text-brand-600">{x.v}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <Check size={15} className="mt-0.5 flex-shrink-0 text-green-600" />
            <p className="text-xs leading-relaxed text-green-800">
              <strong className="font-bold">CR = 0,012 ≤ 0,1</strong> — penilaian expert dinyatakan
              konsisten, sehingga bobot layak dipakai.
            </p>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
            Matriks dibangun dari penilaian Saaty asli, sehingga CR bersifat non-trivial — uji
            konsistensi di sini benar-benar bermakna.
          </p>
        </div>
      </div>
    </Section>
  )
}

// ── Slide 7: Fitur ──────────────────────────────────────────────────────
export function FeatureSection() {
  return (
    <Section id="fitur">
      <SectionHead
        eyebrow="Fitur Aplikasi"
        title="Akses Berbasis Peran & Fitur Pendukung"
        desc="Tiga peran dengan hak akses berbeda — ditegakkan sampai ke lapisan server."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {ROLE_FEATURES.map(r => (
          <div key={r.role} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">{r.role}</h3>
            <ul className="mt-4 space-y-2.5">
              {r.items.map(i => (
                <li key={i} className="flex items-start gap-2.5">
                  <Check size={14} className="mt-0.5 flex-shrink-0 text-brand-600" />
                  <span className="text-xs leading-relaxed text-slate-600">{i}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-6">
        <h3 className="mb-4 text-sm font-bold text-slate-800">Fitur Pendukung &amp; Panel Admin</h3>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {SUPPORT_FEATURES.map(f => (
            <div key={f} className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-4 py-3">
              <Check size={14} className="mt-0.5 flex-shrink-0 text-brand-600" />
              <span className="text-xs leading-relaxed text-slate-600">{f}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}
