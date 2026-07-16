import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip,
} from 'recharts'
import {
  AlertTriangle, Bell, Calendar, CheckCircle2, ClipboardList, Users,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { RiskBadge } from '@/components/ui/Badge'
import { Empty, ErrorState, Loading } from '@/components/ui/States'
import { useAuth } from '@/context/AuthContext'
import { useData } from '@/context/DataContext'
import { RISK_COLOR, RISK_ORDER } from '@/core/constants'
import { displayName, fmt } from '@/core/format'

export default function Dashboard() {
  const { user } = useAuth()
  const { patients, scores, loading, error, reload } = useData()
  const navigate = useNavigate()

  const role = user!.role
  const isKader = role === 'kader'

  const { redFlags, tindaklanjuti, riskCounts, top5 } = useMemo(() => {
    const redFlags = scores.filter(s => s.risk === 'Paling Penting')
    const tindaklanjuti = patients.filter(p => p.tindaklanjuti).length
    const riskCounts = RISK_ORDER.map(r => ({
      name: r,
      value: scores.filter(s => s.risk === r).length,
      fill: RISK_COLOR[r],
    })).filter(r => r.value > 0)
    const top5 = [...scores].sort((a, b) => a.rank - b.rank).slice(0, 5)
    return { redFlags, tindaklanjuti, riskCounts, top5 }
  }, [scores, patients])

  if (loading) return <Loading />
  if (error) return <ErrorState message={error} onRetry={reload} />

  if (patients.length === 0) {
    return (
      <Empty
        icon={<Users size={40} />}
        title="Belum ada data pasien"
        desc="Tambahkan data pemeriksaan pasien terlebih dahulu untuk melihat ringkasan dan ranking prioritas."
        action={
          role !== 'dokter' && (
            <Link
              to="/app/input"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-700"
            >
              Input Data Pasien
            </Link>
          )
        }
      />
    )
  }

  const cards = [
    { label: 'Total Pasien',   val: patients.length,  icon: <Users size={20} />,        color: '#0F5C7A' },
    { label: 'Pasien Red Flag', val: redFlags.length, icon: <AlertTriangle size={20} />, color: '#DC2626' },
    ...(!isKader
      ? [
          { label: 'Sudah Ditindaklanjuti', val: tindaklanjuti,                  icon: <CheckCircle2 size={20} />, color: '#16A34A' },
          { label: 'Perlu Evaluasi',        val: patients.length - tindaklanjuti, icon: <Calendar size={20} />,     color: '#F59E0B' },
        ]
      : []),
  ]

  return (
    <div className="space-y-6">
      {/* Notifikasi red flag */}
      {redFlags.length > 0 && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 animate-fade-in"
        >
          <Bell size={18} className="mt-0.5 flex-shrink-0 text-red-600" />
          <p className="text-sm leading-relaxed text-red-800">
            <strong className="font-bold">Perhatian! </strong>
            {redFlags.length} pasien berstatus <strong className="font-bold">Red Flag</strong>{' '}
            (Paling Penting) membutuhkan tindak lanjut segera.
          </p>
        </div>
      )}

      {/* Kartu ringkasan */}
      <div className={`grid gap-3 sm:gap-4 ${isKader ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'}`}>
        {cards.map(c => (
          <div key={c.label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div
              className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: c.color + '18', color: c.color }}
            >
              {c.icon}
            </div>
            <p className="font-display text-3xl font-extrabold text-slate-900">{c.val}</p>
            <p className="mt-1 text-xs text-slate-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Distribusi */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 font-bold text-slate-800">Distribusi Prioritas Pasien</h2>
          {scores.length < 2 ? (
            <p className="py-16 text-center text-sm text-slate-400">
              Diperlukan minimal 2 pasien untuk menghitung distribusi.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={riskCounts}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {riskCounts.map(entry => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={v => [`${v} pasien`, '']} />
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top 5 */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold text-slate-800">Top 5 Prioritas Penanganan</h2>
            <span className="text-[11px] text-slate-400">Vi terendah = prioritas tertinggi</span>
          </div>

          {scores.length < 2 ? (
            <p className="py-16 text-center text-sm text-slate-400">
              Diperlukan minimal 2 pasien untuk menyusun ranking.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {top5.map(s => {
                const p = patients.find(x => x.id === s.id)!
                return (
                  <li key={s.id}>
                    <button
                      onClick={() => navigate(`/app/pasien/${p.code}`)}
                      className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-slate-50"
                    >
                      <span className="w-4 flex-shrink-0 text-center text-xs font-bold text-slate-300">
                        {s.rank}
                      </span>
                      <Avatar name={p.name} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-800">
                          {p.code} · {displayName(p.name, role)}
                        </span>
                        <span className="block font-mono text-[11px] text-slate-400">
                          Vi = {fmt(s.topsis)}
                        </span>
                      </span>
                      <RiskBadge risk={s.risk} size="sm" />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Pintasan ke ranking */}
      <Link
        to="/app/ranking"
        className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm transition-colors hover:bg-slate-50"
      >
        <span className="flex items-center gap-3">
          <ClipboardList size={18} className="text-brand-600" />
          <span className="text-sm font-semibold text-slate-700">
            Lihat ranking lengkap &amp; analisis
          </span>
        </span>
        <span className="text-xs font-medium text-brand-600">Buka →</span>
      </Link>
    </div>
  )
}
