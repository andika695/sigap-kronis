import { Link } from 'react-router-dom'
import { ArrowRight, GraduationCap, Users } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { TEAM } from './data'

export function TeamSection() {
  return (
    <section id="tim" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mb-5 flex justify-center">
            <Logo size="lg" />
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Kelompok “{TEAM.group}”
          </h2>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <GraduationCap size={14} /> {TEAM.course}
          </p>

          <div className="mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-2.5 sm:grid-cols-2">
            {TEAM.members.map(m => (
              <div key={m} className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-4 py-3">
                <Users size={14} className="flex-shrink-0 text-brand-600" />
                <span className="text-xs font-medium text-slate-700">{m}</span>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs text-slate-400">{TEAM.program}</p>

          <p className="mx-auto mt-8 max-w-lg border-t border-slate-100 pt-8 text-sm italic leading-relaxed text-slate-500">
            “SIGAP-Kronis — mengubah data pemeriksaan rutin menjadi prioritas intervensi yang
            terukur, sebelum komplikasi terjadi.”
          </p>
        </div>
      </div>
    </section>
  )
}

export function CtaFooter() {
  return (
    <footer className="bg-brand-900 px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-xl font-extrabold text-white sm:text-2xl">Siap mencoba sistemnya?</h2>
        <p className="mx-auto mt-2.5 max-w-md text-sm text-white/60">
          Masuk memakai akun demo, atau daftar sebagai Kader maupun Dokter/Perawat.
        </p>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/masuk"
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand-800 transition-all hover:bg-brand-50 active:scale-[.98]"
          >
            Masuk ke Sistem
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/daftar"
            className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-white/10 active:scale-[.98]"
          >
            Daftar Akun
          </Link>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} SIGAP-Kronis · Kelompok “{TEAM.group}” · {TEAM.program}
          </p>
        </div>
      </div>
    </footer>
  )
}
