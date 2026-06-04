# @voxpense/web

Marketing site for VoxPense. Next.js 15 (App Router) + React 19 + Tailwind v3.

Routes:

- `/` — landing (hero, how-it-works, features, screenshots, privacy strip, pricing, FAQ, CTA)
- `/privacy/voxpense` — Play Store privacy policy
- `/terms/voxpense` — Terms of Service
- `/sitemap.xml`, `/robots.txt` — SEO

Designed so the privacy/terms URLs match what's hard-coded in the mobile app's `apps/mobile/app/settings/privacy.tsx`. Deploy at `getsetmvp.com` (root) and in-app links resolve correctly.

## Local development

```bash
pnpm install
pnpm --filter @voxpense/web dev
# http://localhost:3001
```

## Build

```bash
pnpm --filter @voxpense/web build
pnpm --filter @voxpense/web start
```

## Deploy (Vercel)

1. New project → import the voxpense repo.
2. Root Directory: `apps/web`.
3. Framework Preset: Next.js (auto-detected).
4. Build command: `pnpm --filter @voxpense/web build` (or the auto-detected `next build`).
5. Output dir: `.next` (default).
6. Install command: `pnpm install --frozen-lockfile` from repo root.
7. Domain: alias to `getsetmvp.com` (or to a subdomain that you 301-redirect from `getsetmvp.com/voxpense`, `getsetmvp.com/privacy/voxpense`, `getsetmvp.com/terms/voxpense`).

## Theme

Mirrors mobile design tokens from `apps/mobile/src/theme/tokens.ts`:

- Brand: `#6366F1` (indigo) → `#818CF8` dark
- Ink / paper / muted / edge palette identical to mobile light + dark
- Font: Inter via `next/font/google` with `--font-inter` CSS variable

## Assets

- App icon (`public/icon.png`) sourced from `~/Productivity/hustle/voxpense/play-assets/icon-512.png`.
- Phone screenshots in `public/screenshots/` sourced from `~/Productivity/hustle/voxpense/screenshots/final/`. Re-copy when those are updated.

## TODO before launch

- Add `public/og.png` (1200×630) for OpenGraph / Twitter cards.
- Add `public/play-badge.png` when integrating the official Play Store button.
- Wire a contact form (currently `mailto:` only).
