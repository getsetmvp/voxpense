# voxpense

> Voice-first personal expense tracker. Speak → AI parses → categorized expense saved.

## Status

| Field | Value |
|---|---|
| Type | `frontend-mobile` (internal monorepo: `apps/mobile/` day-1, future `apps/web/`) |
| Visibility | Private |
| Status | **Phase 6.5 — mockup-pixel rebuild complete**. All screens rewritten by 4 parallel opus agents to match `~/productivity/hustle/voxpense/mockups/index.html` exactly (Onboarding/Home/Expenses, Capture flows, Insights cluster, Settings cluster). Light + dark + empty + 33-expense seed validated. Ready for user-review APK (Phase 7). |
| Backend tenant | `voxpense` on `https://server.getsetmvp.com/voxpense/v1/*` |
| OTA system | Cloudflare via [yashguptadeveloper/ota-server](https://github.com/yashguptadeveloper/ota-server) — NOT EAS Update |
| Distribution | EAS Build → APK day-1 (Play Store internal testing later) |
| Owner | Yash |
| Founded | 2026-05-31 |

## What it is

Voice-first personal expense tracker. Three capture modes — speak it, snap a receipt, type it — all parsed by AI into categorized expenses. Multi-device sync via shared backend. Conversational Q&A over your data. Production-grade fintech feel.

12 features per design.md: voice capture, photo receipt, manual entry, list, detail, AI Q&A, auto-categorize, budgets, recurring, reminders, wallets, multi-currency.

## Stack

| Layer | Choice |
|---|---|
| Framework | Expo SDK 53 (managed) + React Native 0.79 |
| Language | TypeScript strict |
| Routing | Expo Router (file-based) |
| Styling | NativeWind v4 (Tailwind) |
| State | Zustand + React Query (Phase 5) |
| Auth storage | `expo-secure-store` (NOT AsyncStorage) |
| Voice | `expo-speech-recognition` (on-device STT) |
| Camera | `expo-camera` |
| API client | hand-typed fetch wrapper, `src/lib/api.ts` |
| Backend | tenant `voxpense` in shared [yashguptadeveloper/server](https://github.com/yashguptadeveloper/server) |
| AI | server-proxied via `ai.askchimps.ai` |
| Build | EAS Build (3 profiles: development / preview / production) |
| OTA | Cloudflare Worker + R2 via `ota-server` |
| Error tracking | Sentry React Native (Phase 5) |

## Repository layout

```
voxpense/
├── apps/
│   ├── mobile/                  Expo app (day-1)
│   │   ├── app/                 Expo Router pages
│   │   ├── src/lib/             api, auth, theme
│   │   ├── src/styles/          global.css for NativeWind
│   │   ├── hooks/useOTAUpdates.ts
│   │   ├── scripts/             OTA build + upload
│   │   ├── certs/certificate.pem (PUBLIC, safe to commit)
│   │   ├── app.config.js        dynamic Expo config
│   │   ├── eas.json             3 EAS profiles
│   │   ├── tailwind.config.ts   palette per design.md
│   │   └── package.json
│   └── web/                     (deferred; planned for later)
├── packages/
│   └── shared-types/            TS DTOs shared mobile ↔ server
├── .github/workflows/
│   └── ota-publish.yaml         push to main → preview / tag v* → production
├── README.md                    this file
├── CLAUDE.md                    Claude session primer
├── CONVENTIONS.md               repo-local rules
├── INTEGRATION.md               (n/a — voxpense IS a consumer, not a producer)
└── package.json                 pnpm workspaces root
```

## Quick start

```bash
# Prereqs: Node 20+, pnpm 9+, Expo account (for EAS), Android Studio or USB Android device
cd ~/Projects/voxpense
pnpm install
cd apps/mobile
cp .env.example .env.dev   # fill in EXPO_PUBLIC_API_URL + Cloudflare credentials
pnpm dev                    # Expo Metro dev server (requires Dev Client APK installed first)
```

For first-time Dev Client install:
```bash
cd apps/mobile
npx eas build --profile development --platform android
# install resulting APK on Android device
# then pnpm dev for daily work
```

## Env files

Three-file convention per [`~/productivity/standards/env-files.md`](../../productivity/standards/env-files.md):

| File | Source | Committed? | Purpose |
|---|---|---|---|
| `.env.example` | this repo | ✅ | Placeholder contract |
| `.env.dev` | local laptop | ❌ | Local dev secrets (fresh-random) |
| `.env.prod` | mirror of `/srv/server/.env`-style canonical | ❌ | Local mirror of production secrets, **1Password is canonical** |

`EXPO_PUBLIC_*` vars are baked into the bundle (visible to clients) — never put server-side secrets there.

## Deploy / distribution

### OTA (most updates)

```bash
git commit -m "feat: ..."
git push origin main            # auto: GitHub Actions → builds bundle → uploads R2 → triggers ota-server → preview channel
# OR
git tag v1.0.1
git push --tags                  # auto: same flow but production channel
```

Installed APKs auto-fetch on next cold start. No native rebuild needed for JS changes.

### Native rebuild (Expo SDK / app icon / new native dep)

```bash
cd apps/mobile
npx eas build --profile production --platform android   # AAB for Play Store
npx eas submit --platform android --track internal      # to Play Console internal track
```

## Adding a feature

1. Read `~/productivity/hustle/voxpense/design.md` (locked spec)
2. Identify which Phase 5 agent's scope the feature belongs to (see § 19 partition)
3. Direct commit to `main` until v1 ships (per project policy); afterwards: branch `feat/<feature>` + PR
4. Implement w/ unit tests + screen render tests
5. Run on Android emulator + take screenshot for PR
6. CD auto-publishes OTA to preview channel on push to main; tag `v*.*.*` for production

## Local dev quickstart (Android emulator)

```bash
# 1. Start an Android emulator (Pixel API 34 or any AVD)
~/Library/Android/sdk/emulator/emulator -avd <avd-name> -no-snapshot-load &

# 2. Wait for boot, then build + install the dev client APK once
cd ~/Projects/voxpense/apps/mobile
APP_ENV=preview pnpm run android   # ~5–10 min first time, ~30s incremental

# 3. Subsequent runs: just start Metro
APP_ENV=preview pnpm start
# Then on the device: open the VoxPense (Preview) app → tap dev server row
```

The dev client is a separate install from the production app — both can coexist on the device because they have different `bundleIdentifier` / `package` names in `app.config.js`.

## Build state (Phase 6 validation, 2026-06-01)

| Surface | Empty state | Seeded state (3 wallets / 8 categories / 33 expenses / 4 budgets / 3 reminders / 3 recurring) | Light | Dark |
|---|---|---|---|---|
| Welcome / Login / Signup | ✓ | n/a | ✓ | ✓ |
| Home (greeting + week summary + quick-add + recent) | ✓ | ✓ (₹2,169 week, grouped recent rows w/ category icons) | ✓ | ✓ |
| Expenses (date-grouped infinite scroll + filters + FAB) | ✓ | ✓ (date headers w/ day totals, category icons, wallet labels) | ✓ | ✓ |
| Insights (metrics + donut + bar + top merchants + AI ask) | ✓ ("No expenses yet") | ✓ (₹14.8k 14-day spend, donut top-5, top-3 merchants) | ✓ | ✓ |
| Settings tab (grouped nav w/ counts + chevrons right-aligned) | ✓ | ✓ (Wallets 3, Categories 8, Budgets 4, Recurring 3, Reminders 3) | ✓ | ✓ |
| Profile (avatar + name/email + prefs + log out) | ✓ ("VoxPense member" fallback when createdAt missing) | n/a | ✓ | ✓ |
| Preferences (theme + currency + voice toggles) | ✓ | ✓ | ✓ | ✓ |
| Wallets (gradient hero cards per kind) | ✓ | ✓ (Cash green / HDFC Debit purple / GPay orange) | ✓ | ✓ |
| Categories (grouped by group, icon + color + chevron) | ✓ | ✓ | ✓ | ✓ |
| Budgets (progress bars + status chips, sheet to add/edit) | ✓ | ✓ (4 monthly budgets w/ progress) | ✓ | ✓ |
| Recurring (next-run + freq + amount) | ✓ | ✓ (Rent / Gym / Netflix) | ✓ | ✓ |
| Reminders (bucketed overdue/today/this-week) | ✓ | ✓ | ✓ | ✓ |
| Voice capture modal (mic + transcript + AI parse) | ✓ | ✓ | n/a (full-bleed) | n/a |
| Photo capture (camera w/ frame guide + receipt OCR) | ✓ permission flow + camera live | ✓ | n/a | n/a |
| Manual entry (form + pickers) | ✓ | ✓ | ✓ | ✓ |
| AI Confirm (parsed preview + edit + save) | ✓ | ✓ | ✓ | ✓ |

Known minor polish items deferred to v1.1: live wallet balance computation, expo-image-picker gallery support on photo screen, native date-picker on manual entry, custom date-range preset on expense filters.

## Standards followed

- `~/productivity/standards/frontend-mobile.md` — repo type spec
- `~/productivity/standards/cloudflare-ota.md` — OTA system
- `~/productivity/standards/env-files.md` — env file convention
- `~/productivity/standards/app-development-pipeline.md` — build process
- `~/productivity/standards/hi-fi-mockups.md` — design output format

## Related

- **Planning + design + ADRs**: `~/productivity/hustle/voxpense/` (private)
- **Hi-fi mockups**: `~/productivity/hustle/voxpense/mockups/index.html` (28 phone frames, browser-viewable)
- **Server tenant** (post-Phase 4): `~/Projects/server/src/apps/voxpense/v1/`
- **Shared OTA infra**: [yashguptadeveloper/ota-server](https://github.com/yashguptadeveloper/ota-server)
- **Existing MVP** (reference only, will be archived): `~/Apps/voxpense/`
