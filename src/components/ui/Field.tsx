import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  error?: string
  hint?: ReactNode
  suffix?: string
}

/** Input berlabel dengan pesan galat & tautan aria yang benar. */
export function Field({ label, error, hint, suffix, className = '', ...props }: FieldProps) {
  const id = useId()
  const errId = `${id}-err`
  const hintId = `${id}-hint`

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? errId : hint ? hintId : undefined}
          className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 transition-all
            placeholder:text-slate-300
            focus:outline-none focus:ring-2 focus:ring-brand-600/25
            disabled:bg-slate-50 disabled:text-slate-400
            ${suffix ? 'pr-16' : ''}
            ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-brand-600'}
            ${className}`}
          {...props}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            {suffix}
          </span>
        )}
      </div>
      {error ? (
        <p id={errId} className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p id={hintId} className="mt-1 text-xs text-slate-400">{hint}</p>
      ) : null}
    </div>
  )
}

/** Input password dengan tombol tampil/sembunyi. */
export function PasswordField({ label, error, hint, ...props }: Omit<FieldProps, 'type' | 'suffix'>) {
  const [show, setShow] = useState(false)
  const id = useId()
  const errId = `${id}-err`

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          aria-invalid={!!error}
          aria-describedby={error ? errId : undefined}
          className={`w-full rounded-xl border bg-white px-4 py-3 pr-11 text-sm text-slate-800 transition-all
            placeholder:text-slate-300
            focus:outline-none focus:ring-2 focus:ring-brand-600/25
            ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-brand-600'}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
          aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
          tabIndex={-1}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error ? (
        <p id={errId} className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-400">{hint}</p>
      ) : null}
    </div>
  )
}
