import { Container } from './Container';
import { PhoneFrame } from './PhoneFrame';

const SHOTS = [
  { src: '/screenshots/capture-voice.png', label: 'Voice capture', desc: 'Tap, speak, save.' },
  { src: '/screenshots/04-home-light.png', label: 'Home', desc: 'Today + this month at a glance.' },
  { src: '/screenshots/05-expenses-light.png', label: 'Expenses', desc: 'Filterable history with totals.' },
  { src: '/screenshots/06-ask-light.png', label: 'Ask', desc: 'Natural language over your data.' },
  { src: '/screenshots/07-insights-light.png', label: 'Insights', desc: 'Charts, budgets, trends.' },
  { src: '/screenshots/08-settings-light.png', label: 'Settings', desc: 'Wallets, groups, privacy.' },
];

export function Screenshots() {
  return (
    <section id="screens" className="relative py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand">Screens</span>
          <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Designed to disappear.
          </h2>
          <p className="mt-4 text-lg text-muted dark:text-muted-dark">
            Indigo accents on a flat, breathable canvas. Full light + dark parity. Inter type set with subtle motion.
          </p>
        </div>

        <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {SHOTS.map((s) => (
            <figure key={s.src} className="flex flex-col items-center text-center">
              <PhoneFrame src={s.src} alt={s.label} width={240} />
              <figcaption className="mt-5">
                <p className="text-base font-semibold tracking-tight">{s.label}</p>
                <p className="mt-1 text-sm text-muted dark:text-muted-dark">{s.desc}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
