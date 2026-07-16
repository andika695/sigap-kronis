import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Trash2, UserCog } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Field, PasswordField } from '@/components/ui/Field'
import { Loading } from '@/components/ui/States'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { ApiError, usersApi } from '@/core/api'
import { ROLE_LABEL } from '@/core/constants'
import type { Role, UserAccount } from '@/core/types'

const ROLE_BADGE: Record<Role, string> = {
  admin:  'bg-purple-100 text-purple-700',
  dokter: 'bg-blue-100 text-blue-700',
  kader:  'bg-teal-100 text-teal-700',
}

export function UsersTab() {
  const { user: me } = useAuth()
  const { toast } = useToast()

  const [users, setUsers] = useState<UserAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [confirmDel, setConfirmDel] = useState<UserAccount | null>(null)

  const [form, setForm] = useState({
    name: '', username: '', email: '', password: '', role: 'kader' as Role,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    usersApi
      .list()
      .then(d => setUsers(d.users))
      .catch(err => toast(err instanceof ApiError ? err.message : 'Gagal memuat pengguna.', 'error'))
      .finally(() => setLoading(false))
  }, [toast])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setErrors({})
    setBusy(true)
    try {
      const { user } = await usersApi.create({
        name: form.name.trim(),
        username: form.username.trim().toLowerCase(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
      })
      setUsers(u => [...u, user])
      setForm({ name: '', username: '', email: '', password: '', role: 'kader' })
      setShowForm(false)
      toast(`Pengguna ${user.name} ditambahkan.`)
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(Object.keys(err.fields).length ? err.fields : { form: err.message })
      } else {
        setErrors({ form: 'Terjadi kesalahan tak terduga.' })
      }
    } finally {
      setBusy(false)
    }
  }

  async function toggleActive(u: UserAccount) {
    setBusy(true)
    try {
      const { user } = await usersApi.setActive(u.id, !u.active)
      setUsers(list => list.map(x => (x.id === user.id ? user : x)))
      toast(`${user.name} kini ${user.active ? 'aktif' : 'nonaktif'}.`)
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Gagal mengubah status.', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function remove(u: UserAccount) {
    setBusy(true)
    try {
      await usersApi.remove(u.id)
      setUsers(list => list.filter(x => x.id !== u.id))
      setConfirmDel(null)
      toast(`Pengguna ${u.name} dihapus.`)
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Gagal menghapus pengguna.', 'error')
      setConfirmDel(null)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Loading label="Memuat pengguna…" />

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-bold text-slate-800">Akun Pengguna ({users.length})</h3>
          <Button
            variant={showForm ? 'secondary' : 'primary'}
            size="sm"
            icon={showForm ? undefined : <Plus size={13} />}
            onClick={() => { setShowForm(s => !s); setErrors({}) }}
          >
            {showForm ? 'Batal' : 'Tambah Pengguna'}
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="space-y-4 border-b border-slate-100 bg-slate-50 p-5" noValidate>
            {errors.form && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errors.form}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Nama Lengkap"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                error={errors.name}
                placeholder="mis. Budi Santoso"
              />
              <Field
                label="Username"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                error={errors.username}
                placeholder="mis. kader.budi"
              />
              <Field
                label="Email"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                error={errors.email}
                placeholder="nama@puskesmas.go.id"
              />
              <PasswordField
                label="Password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                error={errors.password}
                hint="Minimal 8 karakter."
                autoComplete="new-password"
              />
              <div>
                <label htmlFor="new-role" className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Peran
                </label>
                <select
                  id="new-role"
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/25"
                >
                  <option value="kader">Kader</option>
                  <option value="dokter">Dokter/Perawat</option>
                  <option value="admin">Admin</option>
                </select>
                {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role}</p>}
              </div>
            </div>

            <Button type="submit" loading={busy} icon={<UserCog size={15} />}>
              Simpan Pengguna
            </Button>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3 text-left font-semibold">Nama</th>
                <th className="px-4 py-3 text-left font-semibold">Username</th>
                <th className="px-4 py-3 text-left font-semibold">Peran</th>
                <th className="px-4 py-3 text-center font-semibold">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map(u => {
                const isMe = u.id === me?.id
                return (
                  <tr key={u.id}>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-800">{u.name}</span>
                      {isMe && (
                        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-500">
                          Anda
                        </span>
                      )}
                      <p className="text-[11px] text-slate-400">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{u.username}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ROLE_BADGE[u.role]}`}>
                        {ROLE_LABEL[u.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleActive(u)}
                        disabled={busy || isMe}
                        title={isMe ? 'Anda tidak dapat menonaktifkan akun sendiri' : 'Klik untuk mengubah status'}
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all disabled:opacity-50 ${
                          u.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {u.active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setConfirmDel(u)}
                        disabled={busy || isMe}
                        className="p-1 text-red-400 transition-colors hover:text-red-600 disabled:opacity-30"
                        aria-label={`Hapus ${u.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmDel}
        title={`Hapus ${confirmDel?.name}?`}
        message="Akun akan dihapus permanen. Catatan tindak lanjut yang pernah dibuat tetap tersimpan."
        loading={busy}
        onConfirm={() => confirmDel && remove(confirmDel)}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  )
}
