import { NavLink } from 'react-router-dom'
import { ClipboardList, LayoutDashboard, LogOut, Plus, Settings, X } from 'lucide-react'
import { LogoWordmark } from '@/components/ui/Logo'
import { ROLE_LABEL } from '@/core/constants'
import type { Role } from '@/core/types'

export interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  roles: Role[]
}

/** Menu aplikasi. Item disaring per peran — dan ditegakkan ulang di server. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/app',          label: 'Dashboard',        icon: <LayoutDashboard size={18} />, roles: ['kader', 'dokter', 'admin'] },
  { to: '/app/input',    label: 'Input Data Pasien', icon: <Plus size={18} />,           roles: ['kader', 'admin'] },
  { to: '/app/ranking',  label: 'Ranking & Analisis', icon: <ClipboardList size={18} />, roles: ['kader', 'dokter', 'admin'] },
  { to: '/app/admin',    label: 'Panel Admin',       icon: <Settings size={18} />,       roles: ['admin'] },
]

export function Sidebar({ role, name, onLogout, open, onClose }: {
  role: Role
  name: string
  onLogout: () => void
  open: boolean
  onClose: () => void
}) {
  const items = NAV_ITEMS.filter(n => n.roles.includes(role))

  return (
    <>
      {/* Lapisan gelap di belakang laci menu (mobile) */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-brand-800 transition-transform duration-300
          lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <LogoWordmark dark />
          <button
            onClick={onClose}
            className="text-white/50 transition-colors hover:text-white lg:hidden"
            aria-label="Tutup menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3" aria-label="Menu utama">
          <p className="mb-2 mt-1 px-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
            Menu
          </p>
          <ul className="space-y-1">
            {items.map(item => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  // 'end' hanya untuk Dashboard, agar tidak ikut aktif di sub-rute.
                  end={item.to === '/app'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                      isActive
                        ? 'bg-white/15 font-semibold text-white'
                        : 'text-white/60 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">{name}</p>
              <p className="text-[11px] text-white/40">{ROLE_LABEL[role]}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/50 transition-all hover:bg-white/10 hover:text-white"
          >
            <LogOut size={16} /> Keluar
          </button>
        </div>
      </aside>
    </>
  )
}
