import Link from 'next/link';
import { Logo, Wordmark } from './Logo';
import { Container } from './Container';
import { site } from '@/lib/site';

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-edge/50 bg-paper/80 backdrop-blur-xl dark:border-edge-dark/50 dark:bg-night/80">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size={30} />
          <Wordmark className="text-lg" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {site.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted transition-colors hover:text-ink dark:text-muted-dark dark:hover:text-ink-inverse"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={site.playStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-ink-inverse transition-transform hover:scale-[1.02] active:scale-95 dark:bg-ink-inverse dark:text-ink"
          >
            Get the app
          </a>
        </div>
      </Container>
    </header>
  );
}
