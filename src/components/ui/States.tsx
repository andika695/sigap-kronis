import { AlertTriangle, Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './Button'

/** Placeholder saat memuat. */
export function Loading({ label = 'Memuat data…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
      <Loader2 size={28} className="animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

/** Keadaan kosong dengan ikon & pesan. */
export function Empty({ icon, title, desc, action }: {
  icon: ReactNode; title: string; desc?: string; action?: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center text-slate-200">{icon}</div>
      <p className="font-semibold text-slate-700">{title}</p>
      {desc && <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">{desc}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/** Kegagalan memuat, dengan tombol coba lagi. */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
      <AlertTriangle size={28} className="mx-auto mb-3 text-red-500" />
      <p className="font-semibold text-red-900">Gagal memuat data</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-red-700">{message}</p>
      {onRetry && (
        <div className="mt-5">
          <Button variant="secondary" size="sm" onClick={onRetry}>Coba lagi</Button>
        </div>
      )}
    </div>
  )
}
