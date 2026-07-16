import { Navbar } from './landing/Navbar'
import { Hero } from './landing/Hero'
import { FeatureSection, MethodSection, ModelSection, ProblemSection } from './landing/Sections'
import { ResultSection } from './landing/ResultSection'
import { CtaFooter, TeamSection } from './landing/Footer'

/**
 * Beranda publik — menjelaskan proyek SIGAP-Kronis.
 * Isi mengikuti SIGAP-Kronis_Slide_AHP-Autentik.pptx (slide 1-9).
 */
export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <ProblemSection />
        <MethodSection />
        <ModelSection />
        <ResultSection />
        <FeatureSection />
        <TeamSection />
      </main>
      <CtaFooter />
    </div>
  )
}
