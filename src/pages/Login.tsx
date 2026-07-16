import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Field, PasswordField } from '@/components/ui/Field'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { ApiError } from '@/core/api'

/** Akun bawaan hasil seed — memudahkan pengujian & demo. */
const DEMO = [
  { label: 'Kader',          username: 'kader.siti',      password: 'kader123' },
  { label: 'Dokter/Perawat', username: 'dr.ahmad',        password: 'dokter123' },
  { label: 'Admin',          username: 'admin.puskesmas', password: 'admin123' },
]

export default function Login() {
  const { user, loading, login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ username: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Sudah punya sesi → langsung ke aplikasi.
  if (!loading && user) {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from ?? '/app'} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErrors({})

    const errs: Record<string, string> = {}
    if (!form.username.trim()) errs.username = 'Username atau NIP wajib diisi.'
    if (!form.password)        errs.password = 'Password wajib diisi.'
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }

    setSubmitting(true)
    try {
      const u = await login(form.username.trim(), form.password)
      toast(`Selamat datang, ${u.name}.`)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from ?? '/app', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(Object.keys(err.fields).length ? err.fields : { form: err.message })
      } else {
        setErrors({ form: 'Terjadi kesalahan tak terduga.' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  function fillDemo(d: typeof DEMO[number]) {
    setForm({ username: d.username, password: d.password })
    setErrors({})
  }

  return (
    <AuthLayout
      title="Masuk"
      subtitle="Sistem Pendukung Keputusan Klinis Puskesmas"
      footer={
        <>
          Belum punya akun?{' '}
          <Link to="/daftar" className="font-semibold text-white underline-offset-4 hover:underline">
            Daftar di sini
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {errors.form && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errors.form}
          </div>
        )}

        <Field
          label="Username / NIP"
          value={form.username}
          onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
          error={errors.username}
          placeholder="mis. kader.siti"
          autoComplete="username"
          autoFocus
        />

        <PasswordField
          label="Password"
          value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          error={errors.password}
          placeholder="••••••••"
          autoComplete="current-password"
        />

        <div className="flex justify-end">
          <Link to="/lupa-password" className="text-xs font-medium text-brand-600 hover:underline">
            Lupa password?
          </Link>
        </div>

        <Button type="submit" full size="lg" loading={submitting} icon={<LogIn size={16} />}>
          Masuk
        </Button>
      </form>

      {/* Pintasan demo */}
      <div className="mt-7 border-t border-slate-100 pt-5">
        <p className="mb-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Akun demo — klik untuk mengisi
        </p>
        <div className="grid grid-cols-3 gap-2">
          {DEMO.map(d => (
            <button
              key={d.username}
              type="button"
              onClick={() => fillDemo(d)}
              className="rounded-lg border border-slate-200 px-2 py-2 text-[11px] font-semibold text-slate-600 transition-all hover:border-brand-600 hover:bg-brand-50 hover:text-brand-700"
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </AuthLayout>
  )
}
