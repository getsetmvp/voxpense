import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Container } from '@/components/Container';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Voxpense Terms of Service. Last updated 2026-06-04.',
  alternates: { canonical: '/terms' },
};

const LAST_UPDATED = '2026-06-04';

export default function TermsPage() {
  return (
    <>
      <Header />
      <main>
        <section className="relative pb-16 pt-12 md:pt-16">
          <div className="radial-fade absolute inset-0 -z-10" />
          <Container>
            <nav className="text-xs text-muted dark:text-muted-dark">
              <Link href="/" className="hover:text-ink dark:hover:text-ink-inverse">Home</Link>
              <span className="mx-2">/</span>
              <span>Terms of service</span>
            </nav>
            <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">Voxpense Terms of Service</h1>
            <p className="mt-3 text-sm text-muted dark:text-muted-dark">
              Last updated <time dateTime={LAST_UPDATED}>{LAST_UPDATED}</time>
            </p>
          </Container>
        </section>

        <Container>
          <article className="prose-content mx-auto max-w-3xl pb-20">
            <p>
              By creating an account or using the Voxpense app (&quot;the Service&quot;) you agree to these terms.
            </p>
            <p>
              Operator: Yash Gupta — <a href="mailto:yash.gupta.developer@gmail.com">yash.gupta.developer@gmail.com</a>.
            </p>

            <h2>1. Eligibility</h2>
            <p>You must be 18 years or older to use the Service.</p>

            <h2>2. Account</h2>
            <p>You are responsible for keeping your login credentials confidential and for activity that occurs under your account. Notify us at <a href="mailto:yash.gupta.developer@gmail.com">yash.gupta.developer@gmail.com</a> if you believe your account is compromised.</p>

            <h2>3. Acceptable use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Service for any unlawful purpose.</li>
              <li>Attempt to gain unauthorized access to other users&apos; accounts or to our server infrastructure.</li>
              <li>Reverse-engineer, decompile, or attempt to derive the source code of the app or backend, except where permitted by applicable law.</li>
              <li>Submit content that infringes third-party rights or contains malware.</li>
            </ul>

            <h2>4. Your data</h2>
            <p>You retain ownership of all expense data you enter. We process it on your behalf solely to provide the Service, as described in the <Link href="/privacy">Privacy Policy</Link>.</p>

            <h2>5. Service availability</h2>
            <p>The Service is provided &quot;as is&quot;. We do not guarantee uninterrupted availability and may schedule maintenance with reasonable notice when possible.</p>

            <h2>6. Pricing</h2>
            <p>The Service is currently free of charge. If we introduce paid tiers, existing accounts will be notified at least 30 days before any charge applies and will retain access to a free tier.</p>

            <h2>7. Termination</h2>
            <p>You may close your account at any time via <em>Settings → Privacy &amp; data → Delete account</em> in the app.</p>
            <p>We may suspend or terminate accounts that materially violate these terms, with notice where reasonable.</p>

            <h2>8. Liability</h2>
            <p>To the extent permitted by law, the Service is not liable for indirect, consequential, or incidental damages arising from your use of the Service. Total cumulative liability is limited to the amount you have paid for the Service in the prior 12 months (currently INR 0).</p>

            <h2>9. Changes</h2>
            <p>We may update these terms. Material changes will be surfaced in-app and the &quot;Last updated&quot; date will change.</p>

            <h2>10. Governing law</h2>
            <p>These terms are governed by the laws of India. Disputes are subject to the exclusive jurisdiction of the courts of Bengaluru, Karnataka.</p>

            <h2>11. Contact</h2>
            <p><a href="mailto:yash.gupta.developer@gmail.com">yash.gupta.developer@gmail.com</a></p>
          </article>
        </Container>
      </main>
      <Footer />
    </>
  );
}
