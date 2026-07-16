import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react'
import { criteriaApi, patientsApi, type CriteriaPayload } from '@/core/api'
import { buildMatrix, calcAHP, type AHPResult } from '@/core/ahp'
import { calcScores } from '@/core/madm'
import type { Comparisons, Criteria, Patient, ScoreResult } from '@/core/types'
import { useAuth } from './AuthContext'

interface DataState {
  patients: Patient[]
  /** Kriteria dengan bobot hasil AHP. */
  criteria: Criteria[]
  comparisons: Comparisons
  ahp: AHPResult
  scores: ScoreResult[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
  /** Ganti seluruh state kriteria dari response API. */
  applyCriteria: (payload: CriteriaPayload) => void
  /** Sisipkan / perbarui satu pasien tanpa memuat ulang semuanya. */
  upsertPatient: (p: Patient) => void
  removePatient: (id: number) => void
}

const DataContext = createContext<DataState | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [patients, setPatients] = useState<Patient[]>([])
  const [meta, setMeta] = useState<Omit<Criteria, 'weight'>[]>([])
  const [comparisons, setComparisons] = useState<Comparisons>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const applyCriteria = useCallback((payload: CriteriaPayload) => {
    setMeta(payload.criteria)
    setComparisons(payload.comparisons)
  }, [])

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [cPayload, pPayload] = await Promise.all([
        criteriaApi.list(),
        patientsApi.list(),
      ])
      applyCriteria(cPayload)
      setPatients(pPayload.patients)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data dari server.')
    } finally {
      setLoading(false)
    }
  }, [applyCriteria])

  // Muat data begitu ada sesi; kosongkan saat logout.
  useEffect(() => {
    if (!user) {
      setPatients([])
      setMeta([])
      setComparisons({})
      setLoading(false)
      return
    }
    void reload()
  }, [user, reload])

  // ── AHP: bobot SELALU diturunkan dari matriks, tidak pernah disimpan ──
  const codes = useMemo(() => meta.map(m => m.code), [meta])
  const matrix = useMemo(() => buildMatrix(codes, comparisons), [codes, comparisons])
  const ahp = useMemo(() => calcAHP(matrix), [matrix])

  const criteria = useMemo<Criteria[]>(
    () => meta.map((m, i) => ({ ...m, weight: ahp.weights[i] ?? 0 })),
    [meta, ahp.weights]
  )

  // SAW + TOPSIS dihitung ulang otomatis setiap data / bobot berubah.
  const scores = useMemo(() => calcScores(patients, criteria), [patients, criteria])

  const upsertPatient = useCallback((p: Patient) => {
    setPatients(prev => {
      const i = prev.findIndex(x => x.id === p.id)
      if (i === -1) return [...prev, p].sort((a, b) => a.code.localeCompare(b.code))
      const next = [...prev]
      next[i] = p
      return next
    })
  }, [])

  const removePatient = useCallback((id: number) => {
    setPatients(prev => prev.filter(p => p.id !== id))
  }, [])

  const value = useMemo(
    () => ({
      patients, criteria, comparisons, ahp, scores,
      loading, error, reload, applyCriteria, upsertPatient, removePatient,
    }),
    [patients, criteria, comparisons, ahp, scores, loading, error, reload, applyCriteria, upsertPatient, removePatient]
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataState {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData harus dipakai di dalam <DataProvider>')
  return ctx
}
