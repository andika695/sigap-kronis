import { Activity } from 'lucide-react'

/** Lambang SIGAP-Kronis. */
export function Logo({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const box = { sm: 'w-9 h-9 rounded-lg', md: 'w-11 h-11 rounded-xl', lg: 'w-14 h-14 rounded-2xl' }[size]
  const icon = { sm: 18, md: 22, lg: 28 }[size]

  return (
    <div
      className={`${box} bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/20 ${className}`}
      aria-hidden="true"
    >
      <Activity size={icon} className="text-white" strokeWidth={2.5} />
    </div>
  )
}

/** Lambang + nama, dipakai di header & sidebar. */
export function LogoWordmark({ subtitle = 'CDSS Puskesmas', dark = false }: { subtitle?: string; dark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Logo size="sm" />
      <div className="leading-tight">
        <div className={`font-display font-extrabold text-[15px] ${dark ? 'text-white' : 'text-slate-900'}`}>
          SIGAP-Kronis
        </div>
        <div className={`text-[11px] ${dark ? 'text-white/50' : 'text-slate-400'}`}>{subtitle}</div>
      </div>
    </div>
  )
}
