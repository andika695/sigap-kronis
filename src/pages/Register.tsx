import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Field, PasswordField } from '@/components/ui/Field'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { ApiError } from '@/core/api'
import type { Role } from '@/core/types'

/**
 * Peran admin sengaja tidak tersedia di sini — akun admin hanya boleh dibuat
 * oleh admin lain lewat Panel Admin. Server menegakkan aturan yang sama.
 */
const ROLE_OPTIONS: { value: Exclude<Role, 'admin'>; label: string; desc: string }[] = [
  { value: 'kader',  label: 'Kader',          desc: 'Input data & lihat ranking' },
  { value: 'dokter', label: 'Dokter/Perawat', desc: 'Validasi & tindak lanjut' },
]

export default function Register() {
  const { user, loading, register } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '', username: '', email: '', password: '', confirm: '',
    role: 'kader' as Exclude<Role, 'admin'>,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) return <Navigate to="/app" replace />

  function set<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErrors({})

    // Validasi klien menyalin aturan server agar galat tampil lebih cepat;
    // server tetap menjadi penentu akhir.
    const errs: Record<string, string> = {}
    if (form.name.trim().length < 3) {
      errs.name = 'Nama lengkap minimal 3 karakter.'
    }
    if (!/^[a-z0-9._]{4,60}$/.test(form.username.trim().toLowerCase())) {
      errs.username = 'Username 4-60 karakter: huruf kecil, angka, titik, garis bawah.'
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = 'Format email tidak valid.'
    }
    if (form.password.length < 8) {
      errs.password = 'Password minimal 8 karakter.'
    }
    if (form.confirm !== form.password) {
      errs.confirm = 'Konfirmasi password tidak cocok.'
    }
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }

    setSubmitting(true)
    try {
      const u = await register({
        name: form.name.trim(),
        username: form.username.trim().toLowerCase(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
      })
      toast(`Akun berhasil dibuat. Selamat datang, ${u.name}.`)
      navigate('/app', { replace: true })
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

  return (
    <AuthLayout
      title="Daftar Akun"
      subtitle="Buat akun untuk mengakses SIGAP-Kronis"
      footer={
        <>
          Sudah punya akun?{' '}
          <Link to="/masuk" className="font-semibold text-white underline-offset-4 hover:underline">
            Masuk di sini
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
          label="Nama Lengkap"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          error={errors.name}
          placeholder="mis. Siti Rahayu"
          autoComplete="name"
          autoFocus
        />

        <Field
          label="Username"
          value={form.username}
          onChange={e => set('username', e.target.value)}
          error={errors.username}
          hint="Huruf kecil, angka, titik, dan garis bawah."
          placeholder="mis. kader.siti"
          autoComplete="username"
        />

        <Field
          label="Email"
          type="email"
          value={form.email}
          onChange={e => set('email', e.target.value)}
          error={errors.email}
          hint="Dipakai untuk memulihkan password."
          placeholder="nama@puskesmas.go.id"
          autoComplete="email"
        />

        {/* Pemilih peran */}
        <fieldset>
          <legend className="mb-1.5 block text-xs font-semibold text-slate-600">Daftar sebagai</legend>
          <div className="grid grid-cols-2 gap-2">
            {ROLE_OPTIONS.map(r => {
              const active = form.role === r.value
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => set('role', r.value)}
                  aria-pressed={active}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    active
                      ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600/20'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className={`block text-sm font-semibold ${active ? 'text-brand-700' : 'text-slate-700'}`}>
                    {r.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-tight text-slate-400">{r.desc}</span>
                </button>
              )
            })}
          </div>
          {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role}</p>}
          <p className="mt-1.5 text-[11px] text-slate-400">
            Akun Admin hanya dapat dibuat oleh Admin melalui Panel Admin.
          </p>
        </fieldset>

        <PasswordField
          label="Password"
          value={form.password}
          onChange={e => set('password', e.target.value)}
          error={errors.password}
          hint="Minimal 8 karakter."
          placeholder="••••••••"
          autoComplete="new-password"
        />

        <PasswordField
          label="Konfirmasi Password"
          value={form.confirm}
          onChange={e => set('confirm', e.target.value)}
          error={errors.confirm}
          placeholder="••••••••"
          autoComplete="new-password"
        />

        <Button type="submit" full size="lg" loading={submitting} icon={<UserPlus size={16} />}>
          Daftar
        </Button>
      </form>
    </AuthLayout>
  )
}
