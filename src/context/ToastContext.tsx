import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

type ToastKind = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  msg: string
  kind: ToastKind
}

interface ToastState {
  toast: (msg: string, kind?: ToastKind) => void
}

const ToastContext = createContext<ToastState | null>(null)

const STYLE: Record<ToastKind, { bg: string; icon: ReactNode }> = {
  success: { bg: 'bg-brand-600', icon: <CheckCircle2 size={18} /> },
  error:   { bg: 'bg-red-600',   icon: <AlertTriangle size={18} /> },
  info:    { bg: 'bg-slate-800', icon: <Info size={18} /> },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: number) => {
    setItems(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((msg: string, kind: ToastKind = 'success') => {
    const id = Date.now() + Math.random()
    setItems(prev => [...prev, { id, msg, kind }])
    // Error dibiarkan lebih lama karena biasanya perlu dibaca.
    setTimeout(() => dismiss(id), kind === 'error' ? 6000 : 3500)
  }, [dismiss])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-[calc(100vw-2rem)] sm:max-w-sm no-print"
        role="status"
        aria-live="polite"
      >
        {items.map(t => (
          <div
            key={t.id}
            className={`${STYLE[t.kind].bg} text-white flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl animate-fade-in`}
          >
            <span className="flex-shrink-0 mt-0.5">{STYLE[t.kind].icon}</span>
            <span className="text-sm font-medium leading-snug flex-1">{t.msg}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Tutup notifikasi"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastState {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast harus dipakai di dalam <ToastProvider>')
  return ctx
}
