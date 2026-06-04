import {
  Mic,
  Camera,
  Pencil,
  MessageSquareText,
  PieChart,
  ShieldCheck,
  Wallet,
  Repeat,
  Bell,
} from 'lucide-react';
import { Container } from './Container';

const FEATURES = [
  {
    icon: Mic,
    title: 'Voice capture',
    blurb:
      'On-device speech recognition turns "coffee 180 cash" into a structured expense in under a second. Hindi + English supported.',
  },
  {
    icon: Camera,
    title: 'Photo receipts',
    blurb:
      'Snap a receipt. AI reads the amount and merchant straight from the image. You confirm. We save.',
  },
  {
    icon: Pencil,
    title: 'Manual fallback',
    blurb:
      'Prefer typing? A clean, four-field form is always one tap away. No multi-page wizards.',
  },
  {
    icon: MessageSquareText,
    title: 'Ask your data',
    blurb:
      'Natural-language queries over your expenses. "How much did I spend on food last week?" Done.',
  },
  {
    icon: PieChart,
    title: 'Insights',
    blurb:
      'Spending by category, by day, by wallet, by group. Budget progress bars. Recurring radar.',
  },
  {
    icon: Wallet,
    title: 'Multi-wallet',
    blurb:
      'Cash, debit, credit, UPI — track every account separately and see total net spend at a glance.',
  },
  {
    icon: Repeat,
    title: 'Recurring + reminders',
    blurb:
      'Rent, EMIs, subscriptions — schedule them once and forget. Get nudged before the next debit.',
  },
  {
    icon: Bell,
    title: 'Budgets that work',
    blurb:
      'Per-category caps with weekly + monthly progress. Honest red-yellow-green; no judgmental popups.',
  },
  {
    icon: ShieldCheck,
    title: 'Private by default',
    blurb:
      'Your data sits on our server in India. No ads, no analytics SDKs, no third-party sharing. Export or delete in one tap.',
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand">
            Everything you need
          </span>
          <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            A budget app that respects your time.
          </h2>
          <p className="mt-4 text-lg text-muted dark:text-muted-dark">
            VoxPense skips the data-entry tax. Every feature here is a knife — sharp, single-purpose, instantly usable.
          </p>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="group relative overflow-hidden rounded-2xl border border-edge bg-paper p-7 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-card dark:border-edge-dark dark:bg-night-surface dark:hover:border-brand-light/40"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted dark:text-muted-dark">{f.blurb}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
