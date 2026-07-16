import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useData } from '@/context/DataContext'
import { useToast } from '@/context/ToastContext'
import { ApiError, criteriaApi } from '@/core/api'
import { fmtSaaty, isConsistent, nearestSaaty, SAATY_OPTIONS } from '@/core/ahp'
import { buildMatrix } from '@/core/ahp'
import type { Criteria } from '@/core/types'

/**
 * Kelola Kriteria + Matriks Perbandingan Berpasangan.
 *
 * Bobot TIDAK dapat disunting langsung — nilainya selalu diturunkan dari
 * matriks (AHP autentik). Mengubah satu sel segitiga atas otomatis memperbarui
 * bobot, lambdaMax, CI, CR, dan seluruh skor pasien.
 */
export function CriteriaTab() {
  const { criteria, comparisons, ahp, applyCriteria } = useData()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)
  const [confirmDel, setConfirmDel] = useState<Criteria | null>(null)

  const codes = criteria.map(c => c.code)
  const matrix = buildMatrix(codes, comparisons)
  const crOk = isConsistent(ahp.CR)

  async function run(fn: () => Promise<void>, okMsg?: string) {
    setBusy(true)
    try {
      await fn()
      if (okMsg) toast(okMsg)
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Terjadi kesalahan.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const updatePair = (row: string, col: string, value: number) =>
    run(async () => applyCriteria(await criteriaApi.setPair(row, col, value)))

  const updateMeta = (c: Criteria, patch: Partial<Criteria>) =>
    run(async () => applyCriteria(await criteriaApi.update(c.id, { ...c, ...patch })))

  const addCriteria = () =>
    run(
      async () =>
        applyCriteria(
          await criteriaApi.add({
            name: 'Kriteria Baru', unit: '', type: 'cost', minValue: 0, maxValue: 100,
          })
        ),
      'Kriteria baru ditambahkan (dinilai sama penting dengan yang lain).'
    )

  const removeCriteria = (c: Criteria) =>
    run(async () => {
      applyCriteria(await criteriaApi.remove(c.id))
      setConfirmDel(null)
    }, `Kriteria ${c.code} dihapus.`)

  return (
    <div className="space-y-5">
      {/* Banner konsistensi */}
      <div
        className={`flex flex-wrap items-center gap-3 rounded-2xl border px-5 py-3.5 text-sm font-medium ${
          crOk ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'
        }`}
      >
        {crOk ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
        <span className="flex-1">
          {ahp.CR === null
            ? 'CR = N/A (n < 3, uji konsistensi tidak diperlukan)'
            : crOk
              ? `KONSISTEN — CR = ${ahp.CR.toFixed(4)} ≤ 0,1`
              : `TIDAK KONSISTEN — CR = ${ahp.CR.toFixed(4)} > 0,1. Perbaiki penilaian pairwise.`}
        </span>
        <span className="font-mono text-[11px] opacity-70">
          λmax = {ahp.lambdaMax.toFixed(4)} · CI = {ahp.CI.toFixed(4)}
        </span>
      </div>

      {/* Daftar kriteria */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Daftar Kriteria</h3>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Bobot diturunkan otomatis dari matriks — tidak dapat diisi manual.
            </p>
          </div>
          <Button variant="secondary" size="sm" icon={<Plus size={13} />} onClick={addCriteria} disabled={busy}>
            Tambah
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                <th className="px-4 py-2.5 text-left font-semibold">ID</th>
                <th className="px-4 py-2.5 text-left font-semibold">Nama</th>
                <th className="px-4 py-2.5 text-left font-semibold">Satuan</th>
                <th className="px-4 py-2.5 text-left font-semibold">Tipe</th>
                <th className="px-4 py-2.5 text-right font-semibold">Rentang</th>
                <th className="px-4 py-2.5 text-right font-semibold">Bobot (AHP)</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {criteria.map(c => (
                <tr key={c.id}>
                  <td className="px-4 py-2.5 font-mono text-xs font-bold text-slate-500">{c.code}</td>
                  <td className="px-4 py-2.5">
                    <input
                      defaultValue={c.name}
                      onBlur={e => e.target.value !== c.name && updateMeta(c, { name: e.target.value })}
                      className="w-full rounded border border-slate-200 px-2 py-1 text-sm focus:border-brand-600 focus:outline-none"
                      aria-label={`Nama ${c.code}`}
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      defaultValue={c.unit}
                      onBlur={e => e.target.value !== c.unit && updateMeta(c, { unit: e.target.value })}
                      className="w-24 rounded border border-slate-200 px-2 py-1 text-sm focus:border-brand-600 focus:outline-none"
                      aria-label={`Satuan ${c.code}`}
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <select
                      value={c.type}
                      onChange={e => updateMeta(c, { type: e.target.value as 'cost' | 'benefit' })}
                      className="rounded border border-slate-200 px-2 py-1 text-sm focus:border-brand-600 focus:outline-none"
                      aria-label={`Tipe ${c.code}`}
                    >
                      <option value="cost">Cost</option>
                      <option value="benefit">Benefit</option>
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <input
                        type="number"
                        defaultValue={c.minValue}
                        onBlur={e => Number(e.target.value) !== c.minValue && updateMeta(c, { minValue: Number(e.target.value) })}
                        className="w-16 rounded border border-slate-200 px-1.5 py-1 text-right text-xs focus:border-brand-600 focus:outline-none"
                        aria-label={`Minimum ${c.code}`}
                      />
                      <span className="text-slate-300">–</span>
                      <input
                        type="number"
                        defaultValue={c.maxValue}
                        onBlur={e => Number(e.target.value) !== c.maxValue && updateMeta(c, { maxValue: Number(e.target.value) })}
                        className="w-16 rounded border border-slate-200 px-1.5 py-1 text-right text-xs focus:border-brand-600 focus:outline-none"
                        aria-label={`Maksimum ${c.code}`}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-brand-600">
                    {c.weight.toFixed(3)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => setConfirmDel(c)}
                      disabled={busy || criteria.length <= 2}
                      className="p-1 text-red-400 transition-colors hover:text-red-600 disabled:opacity-30"
                      aria-label={`Hapus ${c.code}`}
                      title={criteria.length <= 2 ? 'Minimal 2 kriteria harus tersisa' : 'Hapus kriteria'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50">
                <td colSpan={5} className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Total
                </td>
                <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-800">
                  {criteria.reduce((s, c) => s + c.weight, 0).toFixed(3)}
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Matriks pairwise */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-bold text-slate-800">Matriks Perbandingan Berpasangan</h3>
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">
            Isi segitiga atas: baris lebih penting dari kolom → nilai &gt; 1; sebaliknya → nilai &lt; 1.
            Segitiga bawah terisi otomatis (resiprokal).
          </p>
        </div>

        <div className="overflow-x-auto p-4">
          <table className="border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-14 pr-3" />
                {criteria.map(c => (
                  <th key={c.code} className="min-w-[92px] px-1 py-2 text-center text-[11px] font-bold text-slate-600">
                    {c.code}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {criteria.map((row, i) => (
                <tr key={row.code}>
                  <th className="whitespace-nowrap py-1.5 pr-3 text-left text-[11px] font-bold text-slate-600">
                    {row.code}
                  </th>
                  {criteria.map((col, j) => {
                    if (i === j) {
                      return (
                        <td key={col.code} className="px-1 py-1.5 text-center">
                          <div className="mx-auto w-20 rounded bg-slate-100 px-2 py-1.5 text-center font-mono text-xs text-slate-400">
                            1
                          </div>
                        </td>
                      )
                    }
                    if (j > i) {
                      // nearestSaaty menjembatani desimal basis data (0,333333)
                      // dengan nilai opsi (1/3) agar <select> tidak kosong.
                      const raw = comparisons[row.code]?.[col.code] ?? 1
                      return (
                        <td key={col.code} className="px-1 py-1.5 text-center">
                          <select
                            value={nearestSaaty(raw)}
                            onChange={e => updatePair(row.code, col.code, Number(e.target.value))}
                            disabled={busy}
                            aria-label={`Perbandingan ${row.code} terhadap ${col.code}`}
                            className="w-20 cursor-pointer rounded border border-slate-200 bg-white px-1 py-1.5 font-mono text-xs text-slate-800 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/25 disabled:opacity-50"
                          >
                            {SAATY_OPTIONS.map(o => (
                              <option key={o.label} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </td>
                      )
                    }
                    return (
                      <td key={col.code} className="px-1 py-1.5 text-center">
                        <div className="mx-auto w-20 rounded bg-brand-50 px-2 py-1.5 text-center font-mono text-xs text-brand-700">
                          {fmtSaaty(matrix[i][j])}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">
          <div className="flex flex-wrap gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded bg-slate-200" /> Diagonal (terkunci = 1)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded border border-slate-200 bg-white" /> Segitiga atas (diisi admin)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded bg-brand-50" /> Segitiga bawah (resiprokal otomatis)
            </span>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmDel}
        title={`Hapus kriteria ${confirmDel?.code}?`}
        message="Nilai kriteria ini pada semua pasien serta seluruh perbandingan terkait akan ikut terhapus. Bobot dan skor akan dihitung ulang."
        loading={busy}
        onConfirm={() => confirmDel && removeCriteria(confirmDel)}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  )
}
