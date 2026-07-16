import { Link } from 'react-router-dom'
import { ArrowRight, ShieldCheck, Stethoscope } from 'lucide-react'
import { TEAM } from './data'

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-800 to-brand-900 pt-28 pb-20 sm:pt-36 sm:pb-28">
      {/* Ornamen latar */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/80 backdrop-blur">
            <Stethoscope size={13} />
            Sistem Cerdas & Pendukung Keputusan
          </span>

          <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.1] text-white sm:text-5xl lg:text-6xl">
            SIGAP-Kronis
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
            Sistem Pendukung Keputusan untuk stratifikasi risiko pasien{' '}
            <strong className="font-semibold text-white">hipertensi</strong> dan{' '}
            <strong className="font-semibold text-white">diabetes melitus tipe 2</strong> — alat bantu
            deteksi dini &amp; prioritas intervensi di tingkat Puskesmas.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/masuk"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-brand-800 shadow-xl transition-all hover:bg-brand-50 active:scale-[.98]"
            >
              Masuk ke Sistem
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/daftar"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-bold text-white backdrop-blur transition-all hover:bg-white/15 active:scale-[.98]"
            >
              Daftar Akun Baru
            </Link>
          </div>

          <p className="mt-8 flex items-center justify-center gap-2 text-xs text-white/40">
            <ShieldCheck size={13} />
            Kelompok “{TEAM.group}” · {TEAM.program}
          </p>
        </div>
      </div>

      {/* Lengkung pemisah ke bagian berikutnya */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0">
        <svg viewBox="0 0 1440 60" className="h-[60px] w-full fill-slate-50" preserveAspectRatio="none">
          <path d="M0,32 C360,64 1080,0 1440,32 L1440,60 L0,60 Z" />
        </svg>
      </div>
    </section>
  )
}
