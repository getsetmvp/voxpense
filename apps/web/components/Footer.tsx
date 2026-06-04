import Link from 'next/link';
import { Logo, Wordmark } from './Logo';
import { Container } from './Container';
import { site } from '@/lib/site';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-32 border-t border-edge/60 bg-paper-subtle/60 dark:border-edge-dark/60 dark:bg-night-surface/60">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <Logo size={28} />
              <Wordmark className="text-base" />
            </div>
            <p className="mt-3 max-w-sm text-sm text-muted dark:text-muted-dark">
              {site.description}
            </p>
            <a
              href={site.playStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-ink-inverse hover:opacity-95 dark:bg-ink-inverse dark:text-ink"
            >
              Get on Play Store
            </a>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-tight">Product</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted dark:text-muted-dark">
              <li><Link href="/#features" className="hover:text-ink dark:hover:text-ink-inverse">Features</Link></li>
              <li><Link href="/#how" className="hover:text-ink dark:hover:text-ink-inverse">How it works</Link></li>
              <li><Link href="/#screens" className="hover:text-ink dark:hover:text-ink-inverse">Screenshots</Link></li>
              <li><Link href="/#faq" className="hover:text-ink dark:hover:text-ink-inverse">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-tight">Legal</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted dark:text-muted-dark">
              <li><Link href="/privacy" className="hover:text-ink dark:hover:text-ink-inverse">Privacy policy</Link></li>
              <li><Link href="/terms" className="hover:text-ink dark:hover:text-ink-inverse">Terms of service</Link></li>
              <li><Link href="/account-deletion" className="hover:text-ink dark:hover:text-ink-inverse">Delete account</Link></li>
              <li><a href={`mailto:${site.email}`} className="hover:text-ink dark:hover:text-ink-inverse">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-edge/60 pt-6 text-xs text-muted dark:border-edge-dark/60 dark:text-muted-dark md:flex-row">
          <p>© {year} Yash Gupta. All rights reserved.</p>
          <p>
            Built in India · v{site.version} ·{' '}
            <a href={`mailto:${site.email}`} className="hover:text-ink dark:hover:text-ink-inverse">
              {site.email}
            </a>
          </p>
        </div>
      </Container>
    </footer>
  );
}
