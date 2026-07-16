import { RISK_BG } from '@/core/constants'
import type { Risk } from '@/core/types'

/** Badge kategori prioritas. */
export function RiskBadge({ risk, size = 'md' }: { risk: Risk; size?: 'sm' | 'md' }) {
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
  return (
    <span className={`inline-block whitespace-nowrap rounded-full font-semibold ring-1 ring-inset ${RISK_BG[risk]} ${pad}`}>
      {risk}
    </span>
  )
}
