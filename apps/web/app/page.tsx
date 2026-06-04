import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { HowItWorks } from '@/components/HowItWorks';
import { Features } from '@/components/Features';
import { Screenshots } from '@/components/Screenshots';
import { Privacy } from '@/components/Privacy';
import { Pricing } from '@/components/Pricing';
import { FAQ } from '@/components/FAQ';
import { CTA } from '@/components/CTA';
import { Footer } from '@/components/Footer';

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Screenshots />
        <Privacy />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
