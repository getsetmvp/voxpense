import { Container } from './Container';
import { ArrowRight } from 'lucide-react';
import { site } from '@/lib/site';

export function CTA() {
  return (
    <section className="py-24">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand via-brand-deep to-purple-700 p-10 text-white shadow-card sm:p-16">
          <div className="bg-grid absolute inset-0 opacity-10" />
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-purple-300/20 blur-3xl" />

          <div className="relative max-w-2xl">
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
              Stop typing your expenses. Talk to them.
            </h2>
            <p className="mt-4 text-lg text-white/85">
              Voxpense is free, ad-free, and ships with one promise: your data stays yours. Take it for a spin today.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href={site.playStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-deep transition-transform hover:scale-[1.02] active:scale-95"
              >
                Get on Play Store
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href={`mailto:${site.email}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                Talk to the maker
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
