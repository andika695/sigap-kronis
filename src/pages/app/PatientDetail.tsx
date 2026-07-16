import { useMemo, useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart,
  ResponsiveContainer, Legend, Tooltip,
} from 'recharts'
import {
  ArrowLeft, CheckCircle2, Minus, Send, TrendingDown, TrendingUp,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { RiskBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ErrorState, Loading } from '@/components/ui/States'
import { useAuth } from '@/context/AuthContext'
import { useData } from '@/context/DataContext'
import { useToast } from '@/context/ToastContext'
import { RECOMMENDATION } from '@/core/constants'
import { fmt, fmtDate } from '@/core/format'
import { ApiError, patientsApi } from '@/core/api'

export default function PatientDetail() {
  const { code } = useParams<{ code: string }>()
  const { user } = useAuth()
  const { patients, scores, criteria, loading, error, reload, upsertPatient } = useData()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const patient = patients.find(p => p.code === code)
  const score = patient ? scores.find(s => s.id === patient.id) : undefined

  const role = user!.role
  const canFollowUp = role === 'dokter' || role === 'admin'

  /**
   * Radar membandingkan pasien dengan rata-rata populasi.
   * Tiap sumbu diskalakan ke 0-100 terhadap rentang kriteria, karena tanpa itu
   * GDP (ratusan) akan menenggelamkan kepatuhan (1-5) pada sumbu yang sama.
   */
  const radarData = useMemo(() => {
    if (!patient || patients.length === 0) return []
    return criteria.map(c => {
      const span = c.maxValue - c.minValue || 1
      const norm = (v: number) => ((v - c.minValue) / span) * 100
      const avg = patients.reduce((s, p) => s + (p.values[c.code] ?? 0), 0) / patients.length
      return {
        subject: c.code,
        fullName: c.name,
        Pasien: Number(norm(patient.values[c.code] ?? 0).toFixed(1)),
        'Rata-rata': Number(norm(avg).toFixed(1)),
      }
    })
  }, [patient, patients, criteria])

  if (loading) return <Loading />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!patient || !score) return <Navigate to="/app/ranking" replace />

  const rec = RECOMMENDATION[score.risk]

  // Tren memakai skor tersimpan dari perhitungan sebelumnya.
  // Vi naik = menjauh dari red flag = membaik.
  const trend =
    patient.prevTopsis === null
      ? null
      : score.topsis > patient.prevTopsis + 1e-9
        ? 'up'
        : score.topsis < patient.prevTopsis - 1e-9
          ? 'down'
          : 'same'

  async function handleAddNote(e: FormEvent) {
    e.preventDefault()
    if (!note.trim()) return

    setSaving(true)
    try {
      const { patient: updated } = await patientsApi.addNote(patient!.id, note.trim())
      upsertPatient(updated)
      setNote('')
      toast('Catatan tindak lanjut ditambahkan.')
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Gagal menambah catatan.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle() {
    setSaving(true)
    try {
      const { patient: updated } = await patientsApi.toggleFollowUp(patient!.id, !patient!.tindaklanjuti)
      upsertPatient(updated)
      toast(updated.tindaklanjuti ? 'Pasien ditandai sudah ditindaklanjuti.' : 'Tanda tindak lanjut dibatalkan.')
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Gagal memperbarui status.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={() => navigate('/app/ranking')}
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100"
          aria-label="Kembali ke ranking"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar name={patient.name} size="lg" />
          <div className="min-w-0">
            {/* Nama lengkap hanya ditampilkan di halaman detail. */}
            <p className="truncate text-lg font-bold text-slate-900">{patient.name}</p>
            <p className="text-sm text-slate-400">
              {patient.code} · Peringkat {score.rank} dari {scores.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {trend && (
            <span
              className={`flex items-center gap-1 text-xs font-semibold ${
                trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-slate-400'
              }`}
              title="Dibanding perhitungan sebelumnya"
            >
              {trend === 'up' ? <TrendingUp size={14} /> : trend === 'down' ? <TrendingDown size={14} /> : <Minus size={14} />}
              {trend === 'up' ? 'Membaik' : trend === 'down' ? 'Memburuk' : 'Stabil'}
            </span>
          )}
          <RiskBadge risk={score.risk} />
        </div>
      </div>

      {/* Rekomendasi */}
      <div className={`rounded-2xl border px-5 py-4 ${rec.bg}`}>
        <p className={`text-sm font-medium leading-relaxed ${rec.text}`}>{rec.msg}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Nilai kriteria */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 font-bold text-slate-800">Nilai Kriteria</h2>
          <ul className="space-y-3">
            {criteria.map(c => (
              <li key={c.code} className="flex items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="font-mono text-[10px] font-bold text-slate-400">{c.code}</span>
                  <span className="ml-2 text-sm text-slate-700">{c.name}</span>
                </span>
                <span className="flex-shrink-0 text-right">
                  <span className="font-semibold text-slate-900">{patient.values[c.code] ?? '—'}</span>
                  <span className="ml-1 text-[11px] text-slate-400">{c.unit}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
            <div className="text-center">
              <p className="text-[11px] text-slate-400">Skor SAW</p>
              <p className="font-mono text-lg font-bold text-slate-800">{fmt(score.saw)}</p>
            </div>
            <div className="text-center">
              <p className="text-[11px] text-slate-400">Vi TOPSIS</p>
              <p className="font-mono text-lg font-bold text-slate-800">{fmt(score.topsis)}</p>
            </div>
          </div>
        </div>

        {/* Radar */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-bold text-slate-800">Radar vs Rata-rata Populasi</h2>
          <p className="mb-2 text-[11px] text-slate-400">
            Nilai diskalakan 0–100 terhadap rentang tiap kriteria agar sebanding.
          </p>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Pasien" dataKey="Pasien" stroke="#0F5C7A" fill="#0F5C7A" fillOpacity={0.3} />
              <Radar name="Rata-rata" dataKey="Rata-rata" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.12} />
              <Tooltip
                formatter={(v, n) => [`${v}`, n]}
                labelFormatter={l => radarData.find(d => d.subject === String(l))?.fullName ?? l}
              />
              <Legend iconSize={9} wrapperStyle={{ fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Riwayat tindak lanjut */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-slate-800">Riwayat Tindak Lanjut</h2>
          {canFollowUp && (
            <button
              onClick={handleToggle}
              disabled={saving}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all disabled:opacity-50 ${
                patient.tindaklanjuti
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <CheckCircle2 size={14} />
              {patient.tindaklanjuti ? 'Sudah Ditindaklanjuti' : 'Tandai Ditindaklanjuti'}
            </button>
          )}
        </div>

        {patient.followUps.length === 0 ? (
          <p className="py-8 text-center text-sm italic text-slate-400">
            Belum ada riwayat tindak lanjut.
          </p>
        ) : (
          <ol className="mb-4 space-y-3">
            {patient.followUps.map(f => (
              <li key={f.id} className="flex gap-3 rounded-xl bg-slate-50 p-3.5">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-500">
                  {f.author.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-400">
                    {fmtDate(f.date)} · {f.author}
                    <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-500">
                      {f.role}
                    </span>
                  </p>
                  <p className="mt-1 break-words text-sm text-slate-800">{f.note}</p>
                </div>
              </li>
            ))}
          </ol>
        )}

        {canFollowUp ? (
          <form onSubmit={handleAddNote} className="flex gap-2">
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Tulis catatan tindak lanjut…"
              aria-label="Catatan tindak lanjut"
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition-all placeholder:text-slate-300 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/25"
            />
            <Button type="submit" loading={saving} disabled={!note.trim()} icon={<Send size={14} />}>
              Tambah
            </Button>
          </form>
        ) : (
          <p className="rounded-xl bg-slate-50 px-4 py-3 text-center text-[11px] text-slate-400">
            Hanya Dokter/Perawat dan Admin yang dapat menambah catatan tindak lanjut.
          </p>
        )}
      </div>
    </div>
  )
}
