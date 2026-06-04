import { Container } from './Container';
import { Lock, Server, Trash2, Eye } from 'lucide-react';

const POINTS = [
  {
    icon: Lock,
    title: 'TLS in transit, encrypted at rest',
    blurb:
      'All client–server traffic uses HTTPS. Database volumes are encrypted by the cloud provider. Auth tokens live in the device secure enclave.',
  },
  {
    icon: Server,
    title: 'Hosted on Indian cloud',
    blurb:
      'Postgres on our own VM in Mumbai. No third-party SaaS holds your expense data. Daily backups; 30-day retention.',
  },
  {
    icon: Eye,
    title: 'Zero analytics SDKs, zero ads',
    blurb:
      'No Google Analytics, no Mixpanel, no Facebook Pixel. Sentry tracks crashes only — PII scrubbed, no expense content.',
  },
  {
    icon: Trash2,
    title: 'Delete or export — one tap',
    blurb:
      'Export everything as JSON via Share. Delete your account from Settings — server data is wiped in 7 days, backups in 30.',
  },
];

export function Privacy() {
  return (
    <section className="relative py-24">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-brand/[0.04] to-transparent" />
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand">Privacy first</span>
          <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Your money story stays yours.
          </h2>
          <p className="mt-4 text-lg text-muted dark:text-muted-dark">
            We built VoxPense because finance apps shouldn&apos;t harvest your spending data. Read the{' '}
            <a href="/privacy" className="text-brand underline-offset-2 hover:underline">
              full privacy policy
            </a>{' '}
            — it&apos;s plain English.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {POINTS.map((p) => (
            <div
              key={p.title}
              className="flex gap-4 rounded-2xl border border-edge bg-paper p-6 dark:border-edge-dark dark:bg-night-surface"
            >
              <div className="flex-shrink-0">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <p.icon className="h-5 w-5" />
                </div>
              </div>
              <div>
                <h3 className="text-base font-semibold tracking-tight">{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted dark:text-muted-dark">{p.blurb}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
