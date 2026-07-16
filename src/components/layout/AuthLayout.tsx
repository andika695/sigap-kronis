import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Logo } from '@/components/ui/Logo'

/** Kerangka bersama halaman masuk / daftar / lupa password. */
export function AuthLayout({ title, subtitle, children, footer }: {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-brand-600 via-brand-800 to-brand-900 px-4 py-8">
      <div className="mx-auto w-full max-w-md">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
        >
          <ArrowLeft size={16} /> Kembali ke beranda
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="animate-slide-up rounded-2xl bg-white p-7 shadow-2xl sm:p-9">
          <div className="mb-7 text-center">
            <div className="mb-4 flex justify-center">
              <Logo size="lg" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>

          {children}
        </div>

        {footer && <div className="mt-5 text-center text-sm text-white/70">{footer}</div>}
      </div>

      <p className="mx-auto mt-8 max-w-md text-center text-xs text-white/40">
        SIGAP-Kronis · Sistem Cerdas dan Pendukung Keputusan · Universitas Islam Indonesia
      </p>
    </div>
  )
}
