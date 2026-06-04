'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Container } from './Container';
import { clsx } from 'clsx';

const FAQS = [
  {
    q: 'Is Voxpense really free?',
    a: 'Yes. v1 is free for everyone. No ads, no in-app purchases. If we introduce paid tiers later, existing accounts will keep current features at no charge.',
  },
  {
    q: 'Where is my data stored?',
    a: 'On our own server hosted in Mumbai, India (Oracle Cloud Infrastructure). Postgres, encrypted at rest, accessed only over HTTPS. We do not use third-party analytics or marketing SDKs.',
  },
  {
    q: 'Does my voice get sent to the cloud?',
    a: 'No. Speech-to-text runs on your device using the system speech recognizer. Only the resulting text is sent to our server for parsing. Audio files never leave the device unless you explicitly enable "Keep voice audio" in Preferences.',
  },
  {
    q: 'What about receipt photos?',
    a: 'Receipt photos are uploaded to our server to enable AI parsing of amount + merchant. They are retained only to render the expense detail screen and are deleted when you delete the expense or your account.',
  },
  {
    q: 'Which languages does the voice capture support?',
    a: 'Whatever your device speech engine supports. On a typical Android device that includes English, Hindi, Tamil, Telugu, Marathi, Bengali and many more. Set it once in OS settings.',
  },
  {
    q: 'Can I export my data?',
    a: 'Yes. Settings → Privacy & data → Export data produces a JSON file you can share to any target (drive, email, another phone). No format lock-in.',
  },
  {
    q: 'Can I delete my account?',
    a: 'Yes. Settings → Privacy & data → Delete account erases all server data tied to you within 7 days. Backups roll off within 30 days.',
  },
  {
    q: 'Is iOS coming?',
    a: 'Planned for v1.1+. v1 ships Android first because that\'s our daily-driver platform and where the strongest demand is.',
  },
  {
    q: 'Who built this?',
    a: 'Yash Gupta — independent developer based in India. Contact: yash.gupta.developer@gmail.com.',
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand">FAQ</span>
          <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Questions, answered.
          </h2>
          <p className="mt-4 text-lg text-muted dark:text-muted-dark">
            If something here doesn&apos;t cover what you need, email{' '}
            <a href="mailto:yash.gupta.developer@gmail.com" className="text-brand underline-offset-2 hover:underline">
              yash.gupta.developer@gmail.com
            </a>
            .
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-3xl divide-y divide-edge rounded-2xl border border-edge bg-paper dark:divide-edge-dark dark:border-edge-dark dark:bg-night-surface">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <button
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span className="text-base font-semibold tracking-tight">{f.q}</span>
                  <ChevronDown
                    className={clsx('h-4 w-4 flex-shrink-0 text-muted transition-transform', isOpen && 'rotate-180')}
                  />
                </button>
                <div
                  className={clsx(
                    'grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out',
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 text-sm leading-relaxed text-muted dark:text-muted-dark">
                      {f.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
