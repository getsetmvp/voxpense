import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Container } from '@/components/Container';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Account & Data Deletion',
  description:
    'How to delete your Voxpense account and all associated data. In-app one-tap delete or email request.',
  alternates: { canonical: '/account-deletion' },
  robots: { index: true, follow: true },
};

const LAST_UPDATED = '2026-06-05';

const SUBJECT = 'Delete my Voxpense account';
const BODY = `Please delete my Voxpense account and all associated data.

Account email (the email I used to sign up for Voxpense):
[required — fill in your account email]

I understand:
- All expense entries, photos, voice transcripts, wallets, categories, groups, budgets, recurring expenses, and reminders tied to this account will be permanently erased from the production database within 7 days.
- Server backups containing this data will be purged within 30 days.
- Crash reports (Sentry) tied to this user will be removed within 90 days.
- This action cannot be undone.

Thank you.`;

const mailto = `mailto:${site.email}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(BODY)}`;

export default function AccountDeletionPage() {
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
              <span>Account &amp; data deletion</span>
            </nav>
            <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
              Delete your Voxpense account
            </h1>
            <p className="mt-3 text-sm text-muted dark:text-muted-dark">
              Last updated <time dateTime={LAST_UPDATED}>{LAST_UPDATED}</time>
            </p>
          </Container>
        </section>

        <Container>
          <article className="prose-content mx-auto max-w-3xl pb-20">
            <p>
              You can request deletion of your Voxpense account and every piece of personal data
              tied to it at any time. There are two paths — pick whichever is easier for you.
            </p>

            <h2>Option 1 — Delete from inside the app (fastest)</h2>
            <ol className="mb-4 list-decimal space-y-2 pl-6 text-ink/85 dark:text-ink-inverse/85">
              <li>Open Voxpense on your phone.</li>
              <li>
                Go to <strong>Settings → Privacy &amp; data → Delete account</strong>.
              </li>
              <li>Confirm. Your account is queued for deletion immediately.</li>
            </ol>
            <p>
              Server data is wiped within 7 days; backups within 30 days. You will be logged out
              and the app will return to the welcome screen.
            </p>

            <h2>Option 2 — Email request (if you can&apos;t open the app)</h2>
            <p>
              Email{' '}
              <a href={`mailto:${site.email}`} className="font-semibold">
                {site.email}
              </a>{' '}
              with the subject line{' '}
              <code>Delete my Voxpense account</code> and include the email address you used to
              sign up for Voxpense. We&apos;ll acknowledge within 48 hours and delete within 7
              days. No verification call required beyond confirming the address.
            </p>
            <div className="my-6">
              <a
                href={mailto}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-ink-inverse hover:opacity-95 dark:bg-ink-inverse dark:text-ink"
              >
                Open pre-filled email
              </a>
            </div>

            <h2>What gets deleted</h2>
            <p>Both paths erase the same data set:</p>
            <ul>
              <li>Your email address, display name, account preferences (theme, base currency, audio retention toggle).</li>
              <li>Every expense entry — amount, category, wallet, group, merchant, date, notes, attached photo, voice transcript.</li>
              <li>Wallets, categories, groups, budgets, recurring entries, reminders created under your account.</li>
              <li>Hashed password and authentication tokens.</li>
              <li>Server-side photo files associated with your expenses.</li>
              <li>On-device voice audio if &quot;Keep voice audio&quot; was ever enabled — automatically purged when you uninstall the app.</li>
            </ul>

            <h2>What gets kept (and for how long)</h2>
            <ul>
              <li>
                <strong>Crash reports (Sentry):</strong> automatic 90-day rolling retention. These are
                technical stack traces only — no email, no expense content. Deleted automatically
                after 90 days.
              </li>
              <li>
                <strong>Server access logs (nginx):</strong> IP + timestamp + URL path — 14 days rolling.
                Used for abuse / DDoS detection only, not tied to your account identity.
              </li>
              <li>
                <strong>Encrypted database backups:</strong> 30-day rolling. Your row is gone from the
                live database within 7 days but lingers in backups until they age out at 30
                days. No backup is ever restored except for disaster recovery.
              </li>
            </ul>

            <h2>Timeline summary</h2>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>When deleted</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Account, expenses, photos, transcripts (live database)</td>
                  <td>≤ 7 days from request</td>
                </tr>
                <tr>
                  <td>Server backups</td>
                  <td>≤ 30 days from request</td>
                </tr>
                <tr>
                  <td>Crash reports (Sentry)</td>
                  <td>≤ 90 days from last crash</td>
                </tr>
                <tr>
                  <td>nginx access logs</td>
                  <td>≤ 14 days</td>
                </tr>
              </tbody>
            </table>

            <h2>Need an export before deletion?</h2>
            <p>
              In-app: <strong>Settings → Privacy &amp; data → Export data</strong> produces a JSON
              file of your expenses you can save to Drive, email, or any share target. Or
              email{' '}
              <a href={`mailto:${site.email}`}>{site.email}</a> and we&apos;ll send a copy of your
              data before deleting.
            </p>

            <h2>Questions</h2>
            <p>
              Anything unclear — email <a href={`mailto:${site.email}`}>{site.email}</a>. See
              also the full{' '}
              <Link href="/privacy">Privacy Policy</Link> and{' '}
              <Link href="/terms">Terms of Service</Link>.
            </p>
          </article>
        </Container>
      </main>
      <Footer />
    </>
  );
}
