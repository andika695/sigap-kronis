import { initials } from '@/core/format'

/** Avatar inisial. Nama lengkap tidak pernah ditampilkan di sini demi privasi. */
export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const cls = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-12 h-12 text-sm',
  }[size]

  return (
    <div
      className={`${cls} flex-shrink-0 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center select-none`}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  )
}
