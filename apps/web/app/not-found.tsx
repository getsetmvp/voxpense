import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Container } from '@/components/Container';

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="relative">
        <div className="radial-fade absolute inset-0 -z-10" />
        <Container className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">404</p>
          <h1 className="mt-4 text-5xl font-bold tracking-tight md:text-6xl">Page not found.</h1>
          <p className="mt-4 max-w-md text-lg text-muted dark:text-muted-dark">
            The link you followed is broken, or the page has moved. Try the home page or the privacy policy.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-ink-inverse dark:bg-ink-inverse dark:text-ink"
            >
              Back home
            </Link>
            <Link
              href="/privacy"
              className="rounded-full border border-edge px-5 py-2.5 text-sm font-semibold dark:border-edge-dark"
            >
              Privacy policy
            </Link>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
