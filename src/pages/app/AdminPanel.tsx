import { useState } from 'react'
import { ErrorState, Loading } from '@/components/ui/States'
import { useData } from '@/context/DataContext'
import { CriteriaTab } from './admin/CriteriaTab'
import { UsersTab } from './admin/UsersTab'
import { PatientsTab } from './admin/PatientsTab'

type Tab = 'kriteria' | 'pengguna' | 'pasien'

const TABS: { id: Tab; label: string }[] = [
  { id: 'kriteria', label: 'Kelola Kriteria' },
  { id: 'pengguna', label: 'Kelola Pengguna' },
  { id: 'pasien',   label: 'Kelola Data Pasien' },
]

export default function AdminPanel() {
  const { loading, error, reload } = useData()
  const [tab, setTab] = useState<Tab>('kriteria')

  if (loading) return <Loading />
  if (error) return <ErrorState message={error} onRetry={reload} />

  return (
    <div>
      <div className="mb-6 flex w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 sm:w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? 'page' : undefined}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              tab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'kriteria' && <CriteriaTab />}
      {tab === 'pengguna' && <UsersTab />}
      {tab === 'pasien' && <PatientsTab />}
    </div>
  )
}
