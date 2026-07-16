import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { LogoWordmark } from '@/components/ui/Logo'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

/** Judul & deskripsi tiap halaman, dikunci pada path. */
const PAGE_META: Record<string, { title: string; desc: string }> = {
  '/app':         { title: 'Dashboard',          desc: 'Ringkasan kondisi pasien Puskesmas' },
  '/app/input':   { title: 'Input Data Pasien',  desc: 'Tambah data pemeriksaan pasien' },
  '/app/ranking': { title: 'Ranking & Analisis', desc: 'Urutan prioritas penanganan berdasarkan SAW & TOPSIS' },
  '/app/admin':   { title: 'Panel Admin',        desc: 'Manajemen sistem dan konfigurasi kriteria' },
}

export function AppLayout() {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  if (!user) return null

  const meta = PAGE_META[pathname] ?? {
    title: 'Detail Pasien',
    desc: 'Riwayat dan detail analisis pasien',
  }

  async function handleLogout() {
    await logout()
    toast('Anda telah keluar dari sistem.', 'info')
    navigate('/masuk', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        role={user.role}
        name={user.name}
        onLogout={handleLogout}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header mobile */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden no-print">
          <button
            onClick={() => setMenuOpen(true)}
            className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100"
            aria-label="Buka menu"
          >
            <Menu size={20} />
          </button>
          <LogoWordmark subtitle="" />
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6">
              <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">{meta.title}</h1>
              <p className="mt-0.5 text-sm text-slate-400">{meta.desc}</p>
            </div>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
