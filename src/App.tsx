import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { DataProvider } from '@/context/DataContext'
import { ToastProvider } from '@/context/ToastContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { RequireAuth } from '@/components/layout/RequireAuth'
import { Loading } from '@/components/ui/States'

import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import NotFound from '@/pages/NotFound'

// Halaman aplikasi dimuat terpisah: pengunjung beranda tidak perlu ikut
// mengunduh Recharts dan Panel Admin hanya untuk membaca profil proyek.
const Dashboard     = lazy(() => import('@/pages/app/Dashboard'))
const InputPatient  = lazy(() => import('@/pages/app/InputPatient'))
const Ranking       = lazy(() => import('@/pages/app/Ranking'))
const PatientDetail = lazy(() => import('@/pages/app/PatientDetail'))
const AdminPanel    = lazy(() => import('@/pages/app/AdminPanel'))

/**
 * Hasil build berada di /SIGAP-Kronis/dist/, jadi router harus tahu prefiks itu
 * agar tautan dalam aplikasi tidak menunjuk ke root domain. Saat dev, '/'.
 *
 * Diambil dari BASE_URL (vite.config.ts) supaya basename router, path aset, dan
 * alamat API selalu bersumber dari satu nilai yang sama.
 */
const BASENAME = import.meta.env.BASE_URL

export default function App() {
  return (
    <BrowserRouter basename={BASENAME}>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <Routes>
              {/* Publik */}
              <Route path="/" element={<Landing />} />
              <Route path="/masuk" element={<Login />} />
              <Route path="/daftar" element={<Register />} />
              <Route path="/lupa-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Aplikasi — wajib login */}
              <Route
                path="/app"
                element={
                  <RequireAuth>
                    <Suspense fallback={<Loading />}>
                      <AppLayout />
                    </Suspense>
                  </RequireAuth>
                }
              >
                <Route index element={<Dashboard />} />
                <Route
                  path="input"
                  element={
                    <RequireAuth roles={['kader', 'admin']}>
                      <InputPatient />
                    </RequireAuth>
                  }
                />
                <Route path="ranking" element={<Ranking />} />
                <Route path="pasien/:code" element={<PatientDetail />} />
                <Route
                  path="admin"
                  element={
                    <RequireAuth roles={['admin']}>
                      <AdminPanel />
                    </RequireAuth>
                  }
                />
              </Route>

              {/* Alias lama */}
              <Route path="/login" element={<Navigate to="/masuk" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
