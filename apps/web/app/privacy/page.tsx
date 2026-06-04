import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Container } from '@/components/Container';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How Voxpense collects, stores, shares, and deletes your data. Plain English. Last updated 2026-06-04.',
  alternates: { canonical: '/privacy' },
};

const LAST_UPDATED = '2026-06-04';

export default function PrivacyPage() {
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
              <span>Privacy policy</span>
            </nav>
            <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">Voxpense Privacy Policy</h1>
            <p className="mt-3 text-sm text-muted dark:text-muted-dark">
              Last updated <time dateTime={LAST_UPDATED}>{LAST_UPDATED}</time> · Plain English · No dark patterns.
            </p>
          </Container>
        </section>

        <Container>
          <article className="prose-content mx-auto max-w-3xl pb-20">
            <p>
              Voxpense (&quot;the app&quot;) is a personal expense tracker developed and operated by
              Yash Gupta (&quot;we&quot;, &quot;us&quot;). This policy explains what data the app
              collects, how it is stored, who it is shared with, and how to delete it.
            </p>
            <p>
              Contact: <a href="mailto:yash.gupta.developer@gmail.com">yash.gupta.developer@gmail.com</a>.
            </p>

            <h2>1. Data we collect</h2>
            <p>When you create a Voxpense account we collect:</p>
            <ul>
              <li><strong>Email address</strong> (required) — used as your login identifier and for account recovery.</li>
              <li><strong>Display name</strong> (optional) — shown in the app UI; you may leave it blank.</li>
              <li><strong>Expense entries you create</strong> — amount, currency, category, wallet, group, merchant, date, free-text notes, and optionally an attached photo or short voice recording transcript.</li>
            </ul>
            <p>Voxpense <strong>does not</strong> collect:</p>
            <ul>
              <li>Your location.</li>
              <li>Your contacts.</li>
              <li>Your device advertising ID.</li>
              <li>Your browsing history.</li>
              <li>Any third-party app data.</li>
              <li>Any biometric data.</li>
            </ul>

            <h2>2. How voice and photo capture work</h2>
            <p>Voxpense lets you log an expense by speaking (&quot;lunch 320 swiggy&quot;) or by photographing a receipt.</p>
            <ul>
              <li><strong>Voice:</strong> the device&apos;s on-device speech recognizer converts your speech to text locally. Only the resulting text is sent to our server for parsing. Raw audio is <strong>not</strong> uploaded unless you explicitly enable &quot;Keep voice audio&quot; in Preferences — in which case the audio file is stored on your device only and never leaves it.</li>
              <li><strong>Photo:</strong> the receipt image is sent to our server, which forwards it to an AI parsing service to extract amount + merchant. The image is retained on our server only as long as needed to render it in the app&apos;s expense detail screen, and is deleted on account deletion.</li>
            </ul>
            <p>The microphone and camera permissions are requested only at the point of use and can be revoked at any time in your device&apos;s OS settings.</p>

            <h2>3. Where data is stored</h2>
            <p>Your data is stored on a server operated by us:</p>
            <ul>
              <li><strong>Provider:</strong> Oracle Cloud Infrastructure VM, region <code>Mumbai (ap-mumbai-1)</code>.</li>
              <li><strong>Database:</strong> PostgreSQL, scoped to a per-tenant <code>voxpense</code> schema.</li>
              <li><strong>Transport:</strong> all client ↔ server traffic uses HTTPS (TLS 1.2+).</li>
              <li><strong>At rest:</strong> database disk volumes are encrypted by the cloud provider.</li>
            </ul>
            <p>We do not use any third-party analytics, advertising, or marketing SDKs.</p>

            <h2>4. Third parties</h2>
            <p>We share data with the following sub-processors only:</p>
            <table>
              <thead>
                <tr><th>Sub-processor</th><th>Purpose</th><th>Data shared</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>Sentry (<code>sentry.io</code>)</td>
                  <td>Crash reporting</td>
                  <td>Stack traces, device model, OS version, app version. <strong>No PII</strong> (no email, no expense content).</td>
                </tr>
                <tr>
                  <td>AI parsing service (server-side)</td>
                  <td>Voice text parsing, receipt OCR</td>
                  <td>The raw user utterance text or receipt image. The provider does not retain or train on this data per its terms.</td>
                </tr>
              </tbody>
            </table>
            <p>We do not sell or rent your data. We do not share it with advertisers.</p>

            <h2>5. Your rights</h2>
            <ul>
              <li><strong>Export your data:</strong> in-app, <em>Settings → Privacy &amp; data → Export data</em>. Produces a JSON file you can save anywhere.</li>
              <li><strong>Delete your account:</strong> in-app, <em>Settings → Privacy &amp; data → Delete account</em>. Server data is wiped within 7 days (backups within 30).</li>
              <li><strong>Request a copy of any data we hold on you:</strong> email <a href="mailto:yash.gupta.developer@gmail.com">yash.gupta.developer@gmail.com</a>.</li>
              <li><strong>Correct inaccurate data:</strong> edit it directly in the app, or email us.</li>
            </ul>

            <h2>6. Retention</h2>
            <ul>
              <li>Active account data: retained as long as the account exists.</li>
              <li>Deleted account data: erased from primary database within 7 days; erased from backups within 30 days.</li>
              <li>Crash reports (Sentry): 90-day rolling retention.</li>
            </ul>

            <h2>7. Children&apos;s privacy</h2>
            <p>Voxpense is not directed to children under 18 and we do not knowingly collect data from them. If you believe a child has provided us data, contact <a href="mailto:yash.gupta.developer@gmail.com">yash.gupta.developer@gmail.com</a> and we will delete it.</p>

            <h2>8. Security</h2>
            <ul>
              <li>TLS in transit, encryption at rest.</li>
              <li>Passwords are stored hashed (bcrypt).</li>
              <li>Auth tokens (JWT, short-lived) are kept in the device secure enclave (<code>expo-secure-store</code>), never in plain <code>AsyncStorage</code>.</li>
              <li>Server access is restricted to the developer; no third-party operator has shell access to the database.</li>
            </ul>
            <p>We cannot guarantee absolute security; no online service can. We commit to disclosing any confirmed breach affecting your data within 72 hours of confirmation.</p>

            <h2>9. International transfers</h2>
            <p>Our server is hosted in India (Mumbai). If you use the app from outside India, your data will be transferred to and stored in India. We do not transfer data to any other jurisdiction.</p>

            <h2>10. Changes to this policy</h2>
            <p>We will update the &quot;Last updated&quot; date above when we change this policy. Material changes will be surfaced in-app via a notice on next launch.</p>

            <h2>11. Contact</h2>
            <p>
              Questions, requests, or complaints:{' '}
              <a href="mailto:yash.gupta.developer@gmail.com">yash.gupta.developer@gmail.com</a>.
            </p>
            <p>Postal address available on request.</p>
          </article>
        </Container>
      </main>
      <Footer />
    </>
  );
}
