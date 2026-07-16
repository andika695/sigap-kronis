import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Field, PasswordField } from '@/components/ui/Field'
import { useToast } from '@/context/ToastContext'
import { ApiError, authApi } from '@/core/api'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  // Token biasanya datang dari tautan email; tetap bisa ditempel manual.
  const [token, setToken] = useState(params.get('token') ?? '')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErrors({})

    const errs: Record<string, string> = {}
    if (!token.trim())        errs.token    = 'Token reset wajib diisi.'
    if (password.length < 8)  errs.password = 'Password minimal 8 karakter.'
    if (confirm !== password) errs.confirm  = 'Konfirmasi password tidak cocok.'
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }

    setSubmitting(true)
    try {
      await authApi.reset(token.trim(), password)
      toast('Password berhasil diperbarui. Silakan masuk.')
      navigate('/masuk', { replace: true })
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
      title="Atur Ulang Password"
      subtitle="Buat password baru untuk akun Anda"
      footer={
        <Link to="/masuk" className="font-semibold text-white underline-offset-4 hover:underline">
          Kembali ke halaman Masuk
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {errors.form && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errors.form}
          </div>
        )}

        <Field
          label="Token Reset"
          value={token}
          onChange={e => setToken(e.target.value)}
          error={errors.token}
          hint="Token berlaku 1 jam dan hanya dapat dipakai sekali."
          placeholder="Tempel token dari email"
          className="font-mono text-xs"
        />

        <PasswordField
          label="Password Baru"
          value={password}
          onChange={e => setPassword(e.target.value)}
          error={errors.password}
          hint="Minimal 8 karakter."
          placeholder="••••••••"
          autoComplete="new-password"
          autoFocus={!!token}
        />

        <PasswordField
          label="Konfirmasi Password Baru"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          error={errors.confirm}
          placeholder="••••••••"
          autoComplete="new-password"
        />

        <Button type="submit" full size="lg" loading={submitting} icon={<ShieldCheck size={16} />}>
          Simpan Password Baru
        </Button>
      </form>
    </AuthLayout>
  )
}
