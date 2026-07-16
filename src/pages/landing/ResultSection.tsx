import { useMemo } from 'react'
import { Lightbulb } from 'lucide-react'
import { RiskBadge } from '@/components/ui/Badge'
import { buildMatrix, calcAHP } from '@/core/ahp'
import { calcScores, VI_BANDS } from '@/core/madm'
import { fmt } from '@/core/format'
import type { Criteria, Patient } from '@/core/types'

/**
 * Studi kasus PPT slide 6, dihitung LANGSUNG oleh mesin yang sama dengan
 * aplikasi (src/core) — bukan angka yang ditulis ulang. Jadi bila rumus
 * berubah, tabel di beranda ikut berubah dan ketidaksesuaian langsung terlihat.
 */
const CODES = ['C1', 'C2', 'C3', 'C4', 'C5']

const COMPARISONS = {
  C1: { C2: 1, C3: 5, C4: 5, C5: 3 },
  C2: { C3: 5, C4: 5, C5: 3 },
  C3: { C4: 1, C5: 1 / 3 },
  C4: { C5: 1 / 3 },
}

const META: Omit<Criteria, 'weight'>[] = [
  { id: 1, code: 'C1', name: 'Sistolik',   unit: 'mmHg',      type: 'cost',    minValue: 60, maxValue: 250, position: 1 },
  { id: 2, code: 'C2', name: 'GDP',        unit: 'mg/dL',     type: 'cost',    minValue: 50, maxValue: 600, position: 2 },
  { id: 3, code: 'C3', name: 'Usia',       unit: 'tahun',     type: 'cost',    minValue: 1,  maxValue: 120, position: 3 },
  { id: 4, code: 'C4', name: 'BMI',        unit: 'kg/m²',     type: 'cost',    minValue: 10, maxValue: 60,  position: 4 },
  { id: 5, code: 'C5', name: 'Kepatuhan',  unit: 'skala 1-5', type: 'benefit', minValue: 1,  maxValue: 5,   position: 5 },
]

const DEMO_PATIENTS: Patient[] = [
  { id: 1, code: 'P001', name: 'Bu Sari',    values: { C1: 165, C2: 210, C3: 62, C4: 29, C5: 2 }, tindaklanjuti: false, prevSaw: null, prevTopsis: null, followUps: [] },
  { id: 2, code: 'P002', name: 'Pak Joko',   values: { C1: 130, C2: 110, C3: 45, C4: 23, C5: 4 }, tindaklanjuti: false, prevSaw: null, prevTopsis: null, followUps: [] },
  { id: 3, code: 'P003', name: 'Bu Wati',    values: { C1: 150, C2: 180, C3: 55, C4: 27, C5: 3 }, tindaklanjuti: false, prevSaw: null, prevTopsis: null, followUps: [] },
  { id: 4, code: 'P004', name: 'Pak Slamet', values: { C1: 120, C2: 95,  C3: 38, C4: 21, C5: 5 }, tindaklanjuti: false, prevSaw: null, prevTopsis: null, followUps: [] },
  { id: 5, code: 'P005', name: 'Bu Ningsih', values: { C1: 175, C2: 230, C3: 68, C4: 31, C5: 1 }, tindaklanjuti: false, prevSaw: null, prevTopsis: null, followUps: [] },
]

export function ResultSection() {
  const { rows, weights } = useMemo(() => {
    const ahp = calcAHP(buildMatrix(CODES, COMPARISONS))
    const criteria: Criteria[] = META.map((m, i) => ({ ...m, weight: ahp.weights[i] ?? 0 }))
    const scores = calcScores(DEMO_PATIENTS, criteria)
    return {
      weights: criteria,
      rows: [...scores]
        .sort((a, b) => a.rank - b.rank)
        .map(s => ({ ...s, name: DEMO_PATIENTS.find(p => p.code === s.code)!.name })),
    }
  }, [])

  return (
    <section id="hasil" className="scroll-mt-20 bg-slate-50 px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">
            Studi Kasus · Hasil
          </span>
          <h2 className="mt-2.5 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Perankingan SAW &amp; TOPSIS + Kategori Risiko
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-500 sm:text-base">
            Dihitung langsung oleh mesin yang dipakai aplikasi — bukan angka statis.
          </p>
        </div>

        {/* Bobot AHP */}
        <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
          {weights.map(c => (
            <div key={c.code} className="rounded-xl border border-slate-100 bg-white p-3.5 text-center">
              <p className="font-mono text-[10px] font-bold text-slate-400">{c.code}</p>
              <p className="mt-0.5 truncate text-[11px] text-slate-500" title={c.name}>{c.name}</p>
              <p className="mt-1 font-display text-lg font-extrabold text-brand-600">{fmt(c.weight)}</p>
            </div>
          ))}
        </div>

        {/* Tabel hasil */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3 text-left font-semibold">#</th>
                  <th className="px-4 py-3 text-left font-semibold">Pasien</th>
                  <th className="px-4 py-3 text-right font-semibold">SAW</th>
                  <th className="px-4 py-3 text-right font-semibold">Vi TOPSIS</th>
                  <th className="px-4 py-3 text-center font-semibold">Prioritas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map(r => (
                  <tr key={r.code} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3 text-center font-bold text-slate-300">{r.rank}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-800">{r.name}</span>
                      <span className="ml-2 font-mono text-[11px] text-slate-400">{r.code}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{fmt(r.saw)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{fmt(r.topsis)}</td>
                    <td className="px-4 py-3 text-center"><RiskBadge risk={r.risk} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Catatan bobot prioritas */}
          <div className="border-t border-slate-100 bg-slate-50 px-4 py-4 sm:px-5">
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Kategori risiko berdasarkan Vi
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {VI_BANDS.map(b => (
                <div key={b.risk} className="flex items-center gap-2">
                  <RiskBadge risk={b.risk} size="sm" />
                  <span className="font-mono text-[11px] text-slate-500">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Kesimpulan + diskusi kritis (slide 6 & 8) */}
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-brand-100 bg-brand-50 px-5 py-4">
            <p className="text-xs leading-relaxed text-brand-900">
              <strong className="font-bold">Kesimpulan:</strong> kedua metode menghasilkan urutan
              identik (Slamet &gt; Joko &gt; Wati &gt; Sari &gt; Ningsih); TOPSIS memberi gap lebih
              tajam sehingga lebih tegas memisahkan pasien aman dari red flag.
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <div className="flex items-start gap-2.5">
              <Lightbulb size={15} className="mt-0.5 flex-shrink-0 text-amber-600" />
              <p className="text-xs leading-relaxed text-amber-900">
                <strong className="font-bold">Keterbatasan yang kami temukan:</strong> skor bersifat
                relatif terhadap min/max seluruh pasien, sehingga menambah pasien baru dapat menggeser
                skor pasien lama — bukan bug, melainkan sifat model MADM.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
