import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronDown, ChevronUp, ChevronsUpDown, ClipboardList, Download, Eye, Info,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { RiskBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Empty, ErrorState, Loading } from '@/components/ui/States'
import { useAuth } from '@/context/AuthContext'
import { useData } from '@/context/DataContext'
import { useToast } from '@/context/ToastContext'
import { RISK_ORDER } from '@/core/constants'
import { displayName, fmt, fmtRaw } from '@/core/format'
import { VI_BANDS } from '@/core/madm'
import type { Risk } from '@/core/types'

type SortKey = 'rank' | 'saw' | 'topsis'

export default function Ranking() {
  const { user } = useAuth()
  const { patients, scores, criteria, loading, error, reload } = useData()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [filter, setFilter] = useState<'all' | Risk>('all')
  const [sortKey, setSortKey] = useState<SortKey>('rank')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [showTopsis, setShowTopsis] = useState(true)

  const role = user!.role

  const rows = useMemo(() => {
    let list = scores.map(s => ({ ...s, patient: patients.find(p => p.id === s.id)! }))
    if (filter !== 'all') list = list.filter(r => r.risk === filter)
    return list.sort((a, b) => {
      const d = a[sortKey] - b[sortKey]
      return sortDir === 'asc' ? d : -d
    })
  }, [scores, patients, filter, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'rank' ? 'asc' : 'desc')
    }
  }

  /** Ekspor CSV asli — dibuat di sisi klien, tanpa perlu endpoint tambahan. */
  function handleExport() {
    if (rows.length === 0) {
      toast('Tidak ada data untuk diekspor.', 'error')
      return
    }

    const header = [
      'Peringkat', 'ID', 'Nama',
      ...criteria.map(c => `${c.code} (${c.unit})`),
      'SAW', 'Vi TOPSIS', 'Prioritas (Ambang Vi)', 'Prioritas (Kuartil Rank)',
    ]

    const body = [...rows]
      .sort((a, b) => a.rank - b.rank)
      .map(r => [
        r.rank,
        r.patient.code,
        r.patient.name,
        ...criteria.map(c => r.patient.values[c.code] ?? ''),
        fmtRaw(r.saw),
        fmtRaw(r.topsis),
        r.risk,
        r.riskQuartile,
      ])

    // Bungkus tiap sel dengan tanda kutip agar koma pada nama tidak memecah kolom.
    const csv = [header, ...body]
      .map(line => line.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\r\n')

    // BOM UTF-8 agar Excel membaca é, ², dan lainnya dengan benar.
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sigap-kronis-ranking-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast(`Laporan ${rows.length} pasien diekspor ke CSV.`)
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronsUpDown size={12} className="opacity-30" />
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
  }

  if (loading) return <Loading />
  if (error) return <ErrorState message={error} onRetry={reload} />

  if (patients.length < 2) {
    return (
      <Empty
        icon={<ClipboardList size={40} />}
        title="Ranking memerlukan minimal 2 pasien"
        desc={`Saat ini terdapat ${patients.length} pasien. SAW & TOPSIS menormalisasi nilai secara relatif terhadap seluruh pasien, sehingga perbandingan baru bermakna bila ada minimal 2 data.`}
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {/* Alat bantu: filter, toggle, ekspor */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 no-print">
          <div className="flex flex-wrap items-center gap-1.5">
            {(['all', ...RISK_ORDER] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  filter === f
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f === 'all' ? 'Semua' : f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowTopsis(s => !s)}>
              {showTopsis ? 'Tampilkan SAW saja' : 'Tampilkan SAW + TOPSIS'}
            </Button>
            <Button variant="secondary" size="sm" icon={<Download size={13} />} onClick={handleExport}>
              Ekspor
            </Button>
          </div>
        </div>

        {/* Tabel */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <caption className="sr-only">
              Ranking prioritas penanganan pasien berdasarkan skor SAW dan TOPSIS
            </caption>
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                <th scope="col" className="w-14 px-4 py-3 text-left">
                  <button onClick={() => toggleSort('rank')} className="flex items-center gap-1 font-semibold">
                    # <SortIcon k="rank" />
                  </button>
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Pasien</th>
                <th scope="col" className="px-4 py-3 text-right">
                  <button onClick={() => toggleSort('saw')} className="ml-auto flex items-center gap-1 font-semibold">
                    SAW <SortIcon k="saw" />
                  </button>
                </th>
                {showTopsis && (
                  <th scope="col" className="px-4 py-3 text-right">
                    <button onClick={() => toggleSort('topsis')} className="ml-auto flex items-center gap-1 font-semibold">
                      Vi TOPSIS <SortIcon k="topsis" />
                    </button>
                  </th>
                )}
                <th scope="col" className="px-4 py-3 text-center font-semibold">
                  Prioritas
                  <span className="ml-1 font-normal normal-case text-slate-300">(ambang Vi)</span>
                </th>
                <th scope="col" className="px-4 py-3 text-center font-semibold">
                  Kuartil Rank
                </th>
                <th scope="col" className="px-4 py-3 text-center font-semibold no-print">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map(r => (
                <tr key={r.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3 text-center font-bold text-slate-300">{r.rank}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.patient.name} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-800">{r.patient.code}</p>
                        <p className="truncate text-[11px] text-slate-400">
                          {displayName(r.patient.name, role)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">{fmt(r.saw)}</td>
                  {showTopsis && (
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{fmt(r.topsis)}</td>
                  )}
                  <td className="px-4 py-3 text-center"><RiskBadge risk={r.risk} /></td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-[11px] ${
                        r.risk === r.riskQuartile ? 'text-slate-400' : 'font-semibold text-amber-600'
                      }`}
                      title={
                        r.risk === r.riskQuartile
                          ? 'Kedua metode sepakat'
                          : 'Kedua metode berbeda untuk pasien ini'
                      }
                    >
                      {r.riskQuartile}
                      {r.risk !== r.riskQuartile && ' *'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center no-print">
                    <button
                      onClick={() => navigate(`/app/pasien/${r.patient.code}`)}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-600"
                      aria-label={`Lihat detail ${r.patient.code}`}
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && (
          <p className="py-12 text-center text-sm text-slate-400">
            Tidak ada pasien pada kategori “{filter}”.
          </p>
        )}

        {/* ── Catatan bobot prioritas (ambang Vi) ─────────────────────── */}
        <div className="border-t border-slate-100 bg-slate-50 p-4 sm:p-5">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Catatan bobot setiap prioritas
          </p>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {VI_BANDS.map(b => (
              <div
                key={b.risk}
                className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
              >
                <RiskBadge risk={b.risk} size="sm" />
                <span className="font-mono text-[11px] font-medium text-slate-600">{b.label}</span>
              </div>
            ))}
          </div>

          <p className="mt-3.5 text-[11px] leading-relaxed text-slate-500">
            <strong className="font-semibold text-slate-600">Vi</strong> adalah skor preferensi
            TOPSIS = D⁻ / (D⁺ + D⁻). Makin <strong className="font-semibold text-slate-600">rendah</strong>{' '}
            nilai Vi, makin jauh pasien dari kondisi ideal — sehingga makin tinggi prioritas
            penanganannya. Peringkat 1 = Vi terendah.
          </p>
        </div>

        {/* Penjelasan dua metode kategorisasi */}
        <div className="border-t border-slate-100 px-4 py-4 sm:px-5">
          <div className="flex items-start gap-2.5">
            <Info size={14} className="mt-0.5 flex-shrink-0 text-slate-400" />
            <p className="text-[11px] leading-relaxed text-slate-500">
              Kolom <strong className="font-semibold text-slate-600">Prioritas</strong> memakai{' '}
              <strong className="font-semibold text-slate-600">ambang Vi</strong> di atas — sesuai
              tabel pada slide presentasi. Kolom{' '}
              <strong className="font-semibold text-slate-600">Kuartil Rank</strong> menampilkan
              kategori versi pembagian peringkat (tiap kuartil populasi), ditampilkan sebagai
              pembanding. Tanda <strong className="font-semibold text-amber-600">*</strong> menandai
              pasien yang kategorinya berbeda antara kedua metode — biasanya terjadi saat sebaran Vi
              tidak merata.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
