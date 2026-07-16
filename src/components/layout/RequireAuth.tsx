import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Loading } from '@/components/ui/States'
import { useAuth } from '@/context/AuthContext'
import type { Role } from '@/core/types'

/**
 * Penjaga rute sisi klien.
 *
 * Ini hanya untuk kenyamanan navigasi — otorisasi yang sebenarnya ditegakkan
 * di server pada setiap endpoint (lihat api/lib/Auth.php). Menyembunyikan menu
 * saja tidak pernah cukup untuk mengamankan data.
 */
export function RequireAuth({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Loading label="Memeriksa sesi…" />

  if (!user) {
    // Simpan tujuan agar bisa dikembalikan setelah berhasil masuk.
    return <Navigate to="/masuk" replace state={{ from: location.pathname }} />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/app" replace />
  }

  return <>{children}</>
}
