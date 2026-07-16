import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// Konfigurasi Vite — https://vitejs.dev/config/
//
// Aplikasi dilayani Apache (XAMPP) dari C:/xampp/htdocs/SIGAP-Kronis:
//   produksi : http://localhost/SIGAP-Kronis/dist/   (hasil `npm run build`)
//   API      : http://localhost/SIGAP-Kronis/api/
//   dev      : http://localhost:8443/                (Vite + proxy /api ke Apache)
//
// base HARUS absolut, bukan './'. Dengan base relatif, membuka rute bersarang
// seperti /dist/app/ranking membuat browser mencari aset di /dist/app/assets/…
// yang tidak ada — .htaccess lalu mengembalikan index.html, dan browser menolak
// HTML sebagai module script sehingga halaman blank.
//
// Bisa di-override lewat APP_BASE: di Docker aplikasi dilayani dari root ('/'),
// sedangkan di XAMPP dari /SIGAP-Kronis/dist/. Nilai ini juga menentukan
// basename React Router dan alamat API (lihat src/core/api.ts), jadi cukup
// satu variabel untuk memindahkan seluruh aplikasi.
const BASE = process.env.APP_BASE ?? '/SIGAP-Kronis/dist/'

export default defineConfig({
  base: BASE,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '8443'),
    strictPort: true,
    proxy: {
      // Saat dev, /api diteruskan ke Apache agar cookie sesi tetap same-origin.
      '/api': {
        target: 'http://localhost',
        changeOrigin: false,
        rewrite: (p) => p.replace(/^\/api/, '/SIGAP-Kronis/api'),
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '8443'),
  },
})
