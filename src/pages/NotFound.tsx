import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <Logo size="lg" />
      <p className="mt-6 font-display text-6xl font-extrabold text-slate-200">404</p>
      <h1 className="mt-2 text-xl font-bold text-slate-800">Halaman tidak ditemukan</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        Alamat yang Anda tuju tidak tersedia atau sudah dipindahkan.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-700"
        >
          <Compass size={16} /> Kembali ke Beranda
        </Link>
        <Link
          to="/app"
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50"
        >
          Buka Aplikasi
        </Link>
      </div>
    </div>
  )
}
