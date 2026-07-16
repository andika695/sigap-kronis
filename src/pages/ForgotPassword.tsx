import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { KeyRound, MailCheck } from 'lucide-react'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { ApiError, authApi } from '@/core/api'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState<{ message: string; token?: string } | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErrors({})

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrors({ email: 'Format email tidak valid.' })
      return
    }

    setSubmitting(true)
    try {
      const res = await authApi.forgot(email.trim().toLowerCase())
      setSent({ message: res.message, token: res.demo_token })
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

  // ── Setelah token diterbitkan ────────────────────────────────────────
  if (sent) {
    return (
      <AuthLayout title="Cek Email Anda" subtitle="Tautan pemulihan telah diproses">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <MailCheck size={26} className="text-green-600" />
          </div>
          <p className="text-sm leading-relaxed text-slate-600">{sent.message}</p>

          {sent.token && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Mode Demo</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-700">
                SMTP belum dikonfigurasi, jadi token ditampilkan di sini agar alur reset
                dapat dicoba langsung. Pada penerapan nyata, token ini dikirim lewat email.
              </p>
              <code className="mt-2.5 block break-all rounded-lg border border-amber-200 bg-white px-3 py-2 font-mono text-[11px] text-slate-700">
                {sent.token}
              </code>
              <Button
                size="sm"
                className="mt-3"
                full
                onClick={() => navigate(`/reset-password?token=${sent.token}`)}
              >
                Lanjut Atur Ulang Password
              </Button>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2">
            <Link to="/masuk" className="text-sm font-semibold text-brand-600 hover:underline">
              Kembali ke halaman Masuk
            </Link>
            <button
              onClick={() => { setSent(null); setEmail('') }}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Kirim ulang ke email lain
            </button>
          </div>
        </div>
      </AuthLayout>
    )
  }

  // ── Formulir ─────────────────────────────────────────────────────────
  return (
    <AuthLayout
      title="Lupa Password"
      subtitle="Masukkan email terdaftar untuk memulihkan akun"
      footer={
        <>
          Ingat password Anda?{' '}
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
          label="Email Terdaftar"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          error={errors.email}
          placeholder="nama@puskesmas.go.id"
          autoComplete="email"
          autoFocus
        />

        <Button type="submit" full size="lg" loading={submitting} icon={<KeyRound size={16} />}>
          Kirim Tautan Reset
        </Button>

        <p className="text-center text-xs leading-relaxed text-slate-400">
          Demi keamanan, sistem selalu menampilkan pesan yang sama baik email terdaftar
          maupun tidak.
        </p>
      </form>
    </AuthLayout>
  )
}
