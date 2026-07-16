import { useState } from 'react'
import { Edit2, Trash2 } from 'lucide-react'
import { PatientForm } from '@/components/PatientForm'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Empty } from '@/components/ui/States'
import { useData } from '@/context/DataContext'
import { useToast } from '@/context/ToastContext'
import { ApiError, patientsApi } from '@/core/api'
import { Users } from 'lucide-react'
import type { Patient } from '@/core/types'

export function PatientsTab() {
  const { patients, criteria, scores, upsertPatient, removePatient } = useData()
  const { toast } = useToast()
  const [editing, setEditing] = useState<Patient | null>(null)
  const [confirmDel, setConfirmDel] = useState<Patient | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleUpdate(name: string, values: Record<string, number>) {
    if (!editing) return
    // Simpan skor saat ini sebagai pembanding, agar indikator tren di halaman
    // Detail Pasien punya nilai "sebelumnya" untuk dibandingkan.
    const current = scores.find(s => s.id === editing.id)
    const { patient } = await patientsApi.update(editing.id, {
      name,
      values,
      prevSaw: current?.saw,
      prevTopsis: current?.topsis,
    })
    upsertPatient(patient)
    setEditing(null)
    toast(`Data ${patient.name} diperbarui. Skor dihitung ulang.`)
  }

  async function handleDelete(p: Patient) {
    setBusy(true)
    try {
      await patientsApi.remove(p.id)
      removePatient(p.id)
      setConfirmDel(null)
      toast(`Data pasien ${p.name} dihapus.`)
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Gagal menghapus pasien.', 'error')
      setConfirmDel(null)
    } finally {
      setBusy(false)
    }
  }

  if (editing) {
    return (
      <div className="max-w-3xl rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        <h3 className="text-lg font-bold text-slate-900">Edit Data Pasien</h3>
        <p className="mt-1 text-sm text-slate-400">
          {editing.code} · {editing.name}
        </p>
        <div className="my-6 h-px bg-slate-100" />
        <PatientForm
          criteria={criteria}
          patient={editing}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(null)}
        />
      </div>
    )
  }

  if (patients.length === 0) {
    return (
      <Empty
        icon={<Users size={40} />}
        title="Belum ada data pasien"
        desc="Tambahkan pasien melalui menu Input Data Pasien."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-bold text-slate-800">Data Pasien ({patients.length})</h3>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Mengubah nilai kriteria akan memicu perhitungan ulang seluruh skor.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3 text-left font-semibold">ID</th>
                <th className="px-4 py-3 text-left font-semibold">Nama</th>
                {criteria.map(c => (
                  <th key={c.code} className="px-3 py-3 text-right font-semibold" title={c.name}>
                    {c.code}
                  </th>
                ))}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {patients.map(p => (
                <tr key={p.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.code}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                  {criteria.map(c => (
                    <td key={c.code} className="px-3 py-3 text-right text-slate-600">
                      {p.values[c.code] ?? '—'}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditing(p)}
                        className="p-1 text-slate-400 transition-colors hover:text-brand-600"
                        aria-label={`Edit ${p.code}`}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setConfirmDel(p)}
                        className="p-1 text-slate-400 transition-colors hover:text-red-500"
                        aria-label={`Hapus ${p.code}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmDel}
        title={`Hapus data ${confirmDel?.name}?`}
        message="Seluruh nilai kriteria dan riwayat tindak lanjut pasien ini akan ikut terhapus permanen."
        loading={busy}
        onConfirm={() => confirmDel && handleDelete(confirmDel)}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  )
}
