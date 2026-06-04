import { Mic, Sparkles, CheckCircle2 } from 'lucide-react';
import { Container } from './Container';

const STEPS = [
  {
    icon: Mic,
    title: 'Capture',
    detail: 'Tap the mic and speak naturally. Or snap a receipt. Or type if you prefer.',
    accent: 'from-brand to-purple-400',
  },
  {
    icon: Sparkles,
    title: 'Parse',
    detail: 'AI extracts amount, merchant, category, and the right wallet — automatically.',
    accent: 'from-purple-400 to-fuchsia-400',
  },
  {
    icon: CheckCircle2,
    title: 'Confirm',
    detail: 'Quick glance. Tweak if needed. Save. The whole loop takes under five seconds.',
    accent: 'from-fuchsia-400 to-pink-400',
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand">How it works</span>
          <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Three taps from thought to logged.
          </h2>
          <p className="mt-4 text-lg text-muted dark:text-muted-dark">
            No forms. No category pickers. No drop-downs that demand your full attention while the autorickshaw waits.
          </p>
        </div>

        <ol className="mt-16 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="group relative overflow-hidden rounded-2xl border border-edge bg-paper p-7 transition-shadow hover:shadow-card dark:border-edge-dark dark:bg-night-surface"
            >
              <div
                className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${step.accent} opacity-10 blur-2xl transition-opacity group-hover:opacity-20`}
              />
              <div className="flex items-center justify-between">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <step.icon className="h-5 w-5" />
                </div>
                <span className="text-5xl font-bold text-ink/[0.06] dark:text-ink-inverse/[0.08]">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-6 text-xl font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted dark:text-muted-dark">
                {step.detail}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
