import { Container } from './Container';
import { PhoneFrame } from './PhoneFrame';
import { Sparkles, Mic, ArrowRight } from 'lucide-react';
import { site } from '@/lib/site';

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-16 md:pb-32 md:pt-24">
      <div className="radial-fade absolute inset-0 -z-10" />
      <div className="bg-grid absolute inset-0 -z-20 opacity-60 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_30%,transparent_80%)]" />

      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-deep dark:border-brand-light/30 dark:bg-brand/10 dark:text-brand-light">
              <Sparkles className="h-3.5 w-3.5" />
              Voice-first · AI-powered
            </span>

            <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-[68px]">
              <span className="block">Speak it.</span>
              <span className="block">
                We <span className="gradient-text">log it.</span>
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted dark:text-muted-dark">
              VoxPense is the fastest way to track personal expenses. Tap the mic,
              say <em className="text-ink dark:text-ink-inverse">&quot;lunch 320 swiggy&quot;</em>, and AI parses
              the amount, merchant, and category — no menus, no forms, no friction.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href={site.playStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-ink-inverse shadow-card transition-transform hover:scale-[1.02] active:scale-95 dark:bg-ink-inverse dark:text-ink"
              >
                Get on Play Store
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href="#how"
                className="inline-flex items-center gap-2 rounded-full border border-edge bg-paper/60 px-6 py-3 text-sm font-semibold text-ink backdrop-blur transition-colors hover:bg-paper-subtle dark:border-edge-dark dark:bg-night-surface/60 dark:text-ink-inverse dark:hover:bg-night-surface"
              >
                See how it works
              </a>
            </div>

            <dl className="mt-12 grid max-w-md grid-cols-3 gap-4 text-sm">
              <Stat label="Capture modes" value="3" />
              <Stat label="Tap to log" value="<5s" />
              <Stat label="Ads ever" value="0" />
            </dl>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="absolute -inset-8 -z-10 rounded-[60px] bg-gradient-to-br from-brand/30 via-purple-400/20 to-transparent blur-3xl" />
            <div className="flex items-end gap-4 md:gap-6">
              <PhoneFrame
                src="/screenshots/capture-voice.png"
                alt="Voice capture screen"
                width={220}
                className="translate-y-6 md:translate-y-10"
              />
              <PhoneFrame
                src="/screenshots/04-home-light.png"
                alt="Home screen"
                width={260}
                priority
              />
            </div>
            <FloatingChip
              className="absolute -left-4 top-12 hidden lg:flex"
              icon={<Mic className="h-3.5 w-3.5" />}
              label='"lunch 320 swiggy"'
            />
            <FloatingChip
              className="absolute bottom-24 right-0 hidden lg:flex"
              icon={<Sparkles className="h-3.5 w-3.5" />}
              label="parsed in 0.8s"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted dark:text-muted-dark">{label}</dt>
      <dd className="mt-1 text-2xl font-bold tracking-tight">{value}</dd>
    </div>
  );
}

function FloatingChip({
  className,
  icon,
  label,
}: {
  className?: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div
      className={`items-center gap-2 rounded-full border border-edge/80 bg-paper px-3 py-1.5 text-xs font-medium shadow-card dark:border-edge-dark/80 dark:bg-night-surface ${className ?? ''}`}
    >
      <span className="text-brand">{icon}</span>
      <span>{label}</span>
    </div>
  );
}
