import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Info } from 'lucide-react'
import { PatientForm } from '@/components/PatientForm'
import { ErrorState, Loading } from '@/components/ui/States'
import { useData } from '@/context/DataContext'
import { useToast } from '@/context/ToastContext'
import { patientsApi } from '@/core/api'

export default function InputPatient() {
  const { criteria, loading, error, reload, upsertPatient } = useData()
  const { toast } = useToast()
  const [lastSaved, setLastSaved] = useState<{ code: string; name: string } | null>(null)

  if (loading) return <Loading />
  if (error) return <ErrorState message={error} onRetry={reload} />

  async function handleSubmit(name: string, values: Record<string, number>) {
    const { patient } = await patientsApi.create(name, values)
    upsertPatient(patient)
    setLastSaved({ code: patient.code, name: patient.name })
    toast(`Data ${patient.name} tersimpan (${patient.code}). Skor dihitung ulang.`)
  }

  return (
    <div className="max-w-3xl space-y-5">
      {lastSaved && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 animate-fade-in">
          <CheckCircle2 size={18} className="flex-shrink-0 text-green-600" />
          <p className="flex-1 text-sm text-green-800">
            <strong className="font-semibold">{lastSaved.name}</strong> ({lastSaved.code}) berhasil
            disimpan dan seluruh skor telah dihitung ulang.
          </p>
          <Link
            to={`/app/pasien/${lastSaved.code}`}
            className="text-xs font-semibold text-green-700 underline-offset-2 hover:underline"
          >
            Lihat detail →
          </Link>
        </div>
      )}

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-bold text-slate-900">Input Data Pemeriksaan Pasien</h2>
        <p className="mt-1 text-sm text-slate-400">
          ID pasien dibuat otomatis (P0xx). Skor SAW &amp; TOPSIS dihitung ulang setelah disimpan.
        </p>

        <div className="my-6 h-px bg-slate-100" />

        <PatientForm criteria={criteria} onSubmit={handleSubmit} />
      </div>

      <div className="flex items-start gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
        <Info size={15} className="mt-0.5 flex-shrink-0 text-slate-400" />
        <p className="text-xs leading-relaxed text-slate-500">
          Skor bersifat <strong className="font-semibold text-slate-600">relatif</strong> terhadap
          seluruh pasien: menambahkan pasien baru dapat menggeser skor pasien lama karena normalisasi
          SAW &amp; TOPSIS memakai nilai min/max populasi. Ini sifat metode MADM, bukan penurunan
          kondisi klinis pasien.
        </p>
      </div>
    </div>
  )
}
