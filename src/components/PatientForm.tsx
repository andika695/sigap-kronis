import { useState, type FormEvent } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { ApiError } from '@/core/api'
import { fmt } from '@/core/format'
import type { Criteria, Patient } from '@/core/types'

/**
 * Formulir input/ubah data pasien.
 *
 * Field dibangun dari daftar kriteria di basis data — bukan di-hardcode —
 * sehingga kriteria baru yang ditambahkan admin langsung muncul di sini.
 * Rentang validasi juga berasal dari kolom min_value/max_value.
 */
export function PatientForm({ criteria, patient, onSubmit, onCancel, submitLabel }: {
  criteria: Criteria[]
  patient?: Patient | null
  onSubmit: (name: string, values: Record<string, number>) => Promise<void>
  onCancel?: () => void
  submitLabel?: string
}) {
  const [name, setName] = useState(patient?.name ?? '')
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(criteria.map(c => [c.code, patient ? String(patient.values[c.code] ?? '') : '']))
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  function validate(): Record<string, number> | null {
    const errs: Record<string, string> = {}
    const out: Record<string, number> = {}

    if (name.trim().length < 2) {
      errs.name = 'Nama pasien wajib diisi.'
    }

    for (const c of criteria) {
      const raw = values[c.code]?.trim() ?? ''
      if (raw === '') {
        errs[c.code] = `${c.name} wajib diisi.`
        continue
      }
      const num = Number(raw)
      if (!Number.isFinite(num)) {
        errs[c.code] = `${c.name} harus berupa angka.`
        continue
      }
      if (num < c.minValue || num > c.maxValue) {
        errs[c.code] = `Rentang ${fmt(c.minValue, 0)}–${fmt(c.maxValue, 0)} ${c.unit}`.trim()
        continue
      }
      out[c.code] = num
    }

    setErrors(errs)
    return Object.keys(errs).length ? null : out
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = validate()
    if (!parsed) return

    setSubmitting(true)
    try {
      await onSubmit(name.trim(), parsed)
      if (!patient) {
        // Mode tambah: kosongkan agar siap untuk pasien berikutnya.
        setName('')
        setValues(Object.fromEntries(criteria.map(c => [c.code, ''])))
        setErrors({})
      }
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
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {errors.form && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors.form}
        </div>
      )}

      <Field
        label="Nama Lengkap Pasien"
        value={name}
        onChange={e => setName(e.target.value)}
        error={errors.name}
        placeholder="Nama lengkap pasien"
        autoComplete="off"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {criteria.map(c => (
          <Field
            key={c.code}
            label={`${c.code} · ${c.name}`}
            type="number"
            step="any"
            inputMode="decimal"
            value={values[c.code] ?? ''}
            onChange={e => setValues(v => ({ ...v, [c.code]: e.target.value }))}
            error={errors[c.code]}
            hint={`Rentang ${fmt(c.minValue, 0)}–${fmt(c.maxValue, 0)}`}
            suffix={c.unit}
            placeholder={`mis. ${fmt((c.minValue + c.maxValue) / 2, 0)}`}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-3 pt-1">
        <Button type="submit" size="lg" loading={submitting} icon={<Save size={16} />}>
          {submitLabel ?? (patient ? 'Simpan Perubahan' : 'Simpan & Hitung Ulang')}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" size="lg" onClick={onCancel} disabled={submitting}>
            Batal
          </Button>
        )}
      </div>
    </form>
  )
}
