import { Container } from './Container';
import { Check } from 'lucide-react';
import { site } from '@/lib/site';

const FEATURES = [
  'Unlimited expenses',
  'Voice + photo + manual capture',
  'AI parsing & categorization',
  'Ask-your-data natural-language queries',
  'Multi-wallet, multi-currency',
  'Budgets, recurring, reminders',
  'Light + dark themes',
  'Export all data as JSON, anytime',
  'Account delete with full data wipe',
];

export function Pricing() {
  return (
    <section className="py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand">Pricing</span>
          <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Free. No ads. No upsell.
          </h2>
          <p className="mt-4 text-lg text-muted dark:text-muted-dark">
            Voxpense is free for v1. If we add paid tiers later, the current feature set stays free forever for existing users.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:mx-auto lg:max-w-2xl">
          <div className="relative overflow-hidden rounded-3xl border border-brand/30 bg-paper p-8 shadow-card dark:border-brand-light/40 dark:bg-night-surface">
            <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-brand/15 blur-3xl" />
            <div className="relative">
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold tracking-tight">₹0</span>
                <span className="text-sm text-muted dark:text-muted-dark">/ forever</span>
              </div>
              <p className="mt-2 text-sm text-muted dark:text-muted-dark">
                One plan. Everything included. No card on file.
              </p>

              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                      <Check className="h-3 w-3" />
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href={site.playStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-10 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-ink-inverse transition-transform hover:scale-[1.01] active:scale-[0.99] dark:bg-ink-inverse dark:text-ink"
              >
                Download Voxpense
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
