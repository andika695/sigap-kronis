import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { LogoWordmark } from '@/components/ui/Logo'
import { useAuth } from '@/context/AuthContext'

const LINKS = [
  { href: '#masalah', label: 'Masalah' },
  { href: '#metode',  label: 'Metode' },
  { href: '#model',   label: 'Model' },
  { href: '#fitur',   label: 'Fitur' },
  { href: '#tim',     label: 'Tim' },
]

export function Navbar() {
  const { user } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  // Latar navbar berubah setelah digulir agar teks tetap terbaca.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'border-b border-slate-200 bg-white/85 backdrop-blur-lg' : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link to="/" aria-label="SIGAP-Kronis — beranda">
          <LogoWordmark subtitle="CDSS Puskesmas" dark={!scrolled} />
        </Link>

        {/* Menu desktop */}
        <ul className="hidden items-center gap-1 lg:flex">
          {LINKS.map(l => (
            <li key={l.href}>
              <a
                href={l.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  scrolled ? 'text-slate-600 hover:bg-slate-100' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <Link
              to="/app"
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-brand-700"
            >
              Buka Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/masuk"
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                  scrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-white hover:bg-white/10'
                }`}
              >
                Masuk
              </Link>
              <Link
                to="/daftar"
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-brand-700"
              >
                Daftar
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setOpen(o => !o)}
          className={`rounded-lg p-2 transition-colors lg:hidden ${
            scrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-white hover:bg-white/10'
          }`}
          aria-label={open ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={open}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Menu mobile */}
      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
          <ul className="space-y-1">
            {LINKS.map(l => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
            {user ? (
              <Link
                to="/app"
                className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                Buka Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/masuk"
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-700"
                >
                  Masuk
                </Link>
                <Link
                  to="/daftar"
                  className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
