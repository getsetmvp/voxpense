# CLAUDE.md

Context for Claude when working in this repo.

## TL;DR for a fresh session

1. Read [`~/Productivity/hustle/voxpense/state.md`](../../Productivity/hustle/voxpense/state.md) FIRST — current phase, the big bug history, how to boot the emulator, how to log in to the seeded test account.
2. Then this file for conventions.
3. Then `~/Productivity/hustle/voxpense/design.md` for the locked spec.
4. Then `~/Productivity/hustle/voxpense/mockups/index.html` for the pixel target.

## What this repo is

Voice-first personal expense tracker. Expo SDK 54 mobile app + voxpense tenant inside the shared NestJS backend at `~/Projects/server`. **MVP-design rebuild complete (2026-06-01)** — the earlier glassmorphism mockup was deprecated; the entire UI layer was rewritten against the v0 MVP design language at `~/Apps/voxpense/docs/design/mockups/index.html` (now canonicalized at `~/productivity/hustle/voxpense/mockups/index.html`). 22 screens working light + dark; backend untouched. Ready for **Phase 7 (preview APK to physical device)**.

## Required reading

- **Current state**: [`~/Productivity/hustle/voxpense/state.md`](../../Productivity/hustle/voxpense/state.md)
- **Launch plan**: [`~/Productivity/hustle/voxpense/play-store.md`](../../Productivity/hustle/voxpense/play-store.md)
- **Project layout convention**: [`~/Productivity/standards/project-layout.md`](../../Productivity/standards/project-layout.md) — single source of truth for where files go
- **Repo type**: `frontend-mobile`
- **Type spec**: `~/Productivity/standards/frontend-mobile.md`
- **OTA system**: `~/Productivity/standards/cloudflare-ota.md`
- **Pipeline**: `~/Productivity/standards/app-development-pipeline.md` (10 phases, MVP-rebuild done, next is Phase 7 APK)
- **Env files**: `~/Productivity/standards/env-files.md`
- **Design (FROZEN — MVP)**: `~/Productivity/hustle/voxpense/mockups/index.html` (MVP visual language, canonical)
- **Design spec**: `~/Productivity/hustle/voxpense/design.md`

When proposing changes, follow design.md. **The design is FROZEN** — changes require ADR (write to `~/Productivity/hustle/voxpense/decisions.md`).

## Read order on session start

1. `~/Productivity/hustle/voxpense/state.md` (current state + bugs + pickup commands)
2. `README.md` (project intro + build status table)
3. `CONVENTIONS.md` (commit / branch rules)
4. `~/Productivity/hustle/voxpense/design.md` (full spec)
5. `~/Productivity/hustle/voxpense/mockups/index.html` (canonical MVP design — open in browser)
6. `packages/shared-types/src/index.ts` (DTOs locked, mirror of server)
7. `apps/mobile/src/lib/api.ts` + `apps/mobile/src/lib/endpoints.ts` (fetch wrapper + typed namespaces)
8. `apps/mobile/src/components/ui/index.ts` + `src/components/layout/index.ts` (foundation primitives)
9. `apps/mobile/src/theme/ThemeProvider.tsx` (theme tokens + `useTheme()`)

## Project layout

```
apps/mobile/
├── app/                          Expo Router pages (file-based)
│   ├── _layout.tsx               providers + AuthGate
│   ├── index.tsx                 splash redirect
│   ├── (onboarding)/             welcome + login + signup
│   ├── (tabs)/                   home + expenses + insights + settings
│   ├── (capture)/                voice + photo + manual + confirm (modal stack)
│   ├── expense/[id].tsx          expense detail/edit
│   └── settings/                 profile, preferences, wallets, categories, groups, budgets, recurring, reminders, privacy, about
├── src/
│   ├── components/ui/            FOUNDATION primitives (Button/Card/Chip/Input/ListItem/Sheet/Skeleton/Toast/Banner/Amount/ConfirmDialog/EmptyState)
│   ├── components/layout/        Screen/Header/SectionHeader/Dots/FabStack
│   ├── components/feature/       ExpenseRow + FilterSheet (composed feature widgets)
│   ├── components/ErrorBoundary.tsx
│   ├── lib/api.ts                fetch wrapper + auto-refresh (DO NOT bypass)
│   ├── lib/endpoints.ts          typed API namespaces
│   ├── lib/format.ts             currency + date helpers
│   ├── lib/insights.ts           pure aggregation (testable, no React)
│   ├── lib/money.ts              symbolOf / formatMoney / splitMoney
│   ├── lib/currencies.ts         SEED_CURRENCIES catalogue
│   ├── lib/speechRecognition.ts  Expo Go shim for expo-speech-recognition
│   ├── store/auth.ts             Zustand auth state
│   ├── store/theme.ts            Zustand theme mode (auto/light/dark)
│   ├── queries/{expenses,insights}.ts   React Query hooks
│   ├── theme/tokens.ts           lightTokens + darkTokens (MVP palette)
│   └── theme/ThemeProvider.tsx   useTheme() → { tokens, mode, resolved, setMode }
│   ├── query/client.ts           QueryClient + qk registry
│   ├── theme/tokens.ts           spacing / radii / motion / shadows
│   └── styles/global.css         NativeWind entry
├── hooks/useOTAUpdates.ts
├── scripts/                      OTA build pipeline
├── certs/certificate.pem         PUBLIC cert; safe to commit
├── app.config.js                 dynamic Expo config (APP_ENV driven)
├── eas.json                      3 EAS profiles
└── tailwind.config.ts            palette per design.md (same palette mockups use)

packages/shared-types/src/index.ts   DTOs shared mobile ↔ server
.github/workflows/ota-publish.yaml   push to main → preview / tag v* → production
```

## Conventions (must follow)

- **TypeScript strict** (`noUncheckedIndexedAccess: true`)
- **Functional components only** — no classes except `ErrorBoundary`
- **Server state via React Query** — never `useEffect` fetches, never Zustand for server state
- **Auth state via Zustand** (`src/store/auth.ts`) — secure tokens in `expo-secure-store` (NEVER AsyncStorage)
- **Expo Router for navigation** — file-based, never `@react-navigation/native` directly
- **NativeWind v4** for styling — className strings, palette from `tailwind.config.ts`
- **Foundation components** — `Screen` / `Header` / `Card` / `Button` / `Input` / `ListItem` / `Sheet` / `Chip` / `Amount` / `Banner` / `EmptyState` / `ConfirmDialog` / `Toast` from `src/components/ui` + `src/components/layout`. Never reinvent.
- **Colors via `useTheme().tokens`** — never hardcode hex strings outside `src/theme/tokens.ts` + `tailwind.config.ts`. Brand is `tokens.brand` (indigo).
- **AI calls via server** — never call `ai.askchimps.ai` directly. Use `ai.*` from `src/lib/endpoints.ts`.
- **API calls via `src/lib/endpoints.ts`** — never raw fetch
- **Pressable styles** — STATIC array-form only for layout-bearing Pressables (see "Critical no-go's" below)
- **Branch model** — direct commit to `main` until v1 ships (see `~/.claude/projects/-Users-yashgupta/memory/feedback_voxpense_direct_main.md`)
- **Conventional Commits**: `feat:` / `fix:` / `docs:` / `chore:` / `refactor:` / `test:` / `perf:` / `build:` / `ci:`

## Critical no-go's

- ❌ **`style={({ pressed }) => ({ flexDirection: 'row', ...})}` on Pressable** — Android Fabric drops layout props from function-form object returns. Use `style={[styles.row, { opacity: pressed ? 0.85 : 1 }]}` array-form. See [`state.md`](../../Productivity/hustle/voxpense/state.md) "the big bug".
- ❌ Direct calls to `ai.askchimps.ai` from the app
- ❌ Static bearer tokens in source — never
- ❌ AsyncStorage for tokens — always `expo-secure-store`
- ❌ Hardcoded API URLs — use `Constants.expoConfig.extra.apiUrl`
- ❌ Bypassing `api.ts` w/ raw fetch
- ❌ Editing `app.config.js` `updates.url` — locked to ota-server pattern
- ❌ Adding new EAS profiles outside `development` / `preview` / `production`
- ❌ Skipping screen render tests when adding a new screen
- ❌ Storing user-input PII in client-side logs
- ❌ `expenses` API `limit > 200` — server rejects with 400

## Auto-behaviors

- On `.ts/.tsx` edit: ensure NativeWind className used (not inline styles for layout)
- On new screen: must wrap in `<Screen>` from glass; mockup must exist or be approved
- On new API call: wrap in a `src/lib/endpoints.ts` namespace if not present
- On new env var: update `apps/mobile/.env.example`

## Pitfalls (learned the hard way)

- **NativeWind v4 + Reanimated v3**: ensure `babel-plugin-react-native-reanimated` is LAST in plugin order (already correct in `babel.config.js`).
- **react-native-worklets**: transitively required by `react-native-css-interop` babel transform. Pinned to `^0.5.1` — DO NOT upgrade past 0.5.x without bumping RN to 0.83+.
- **Expo dev client APK rebuild required** when adding native deps or changing `app.config.js` plugin list (icon/splash/permissions). JS-only changes hot-reload via Metro.
- **OTA only ships JS**: SDK upgrades + native config changes require fresh EAS build + new `runtimeVersion`.
- **runtimeVersion locked to "1.0.0"** in `app.config.js`. Bumping invalidates older OTA bundles.
- **Code signing in dev**: the production-signed dev APK rejects unsigned Metro manifests. We strip `CODE_SIGNING_*` meta from `AndroidManifest.xml` post-prebuild — see Phase 6 fix commit. If you regenerate `android/`, you may need to re-strip.
- **Two emulators at once**: AVD lock prevents multi-instance. Clone the AVD dir (`cp -R ~/.android/avd/<avd>.avd ~/.android/avd/<clone>.avd`) and boot the second with `-read-only`.
- **Metro port collisions**: user often has a parallel `expo start` on 8082. Use 8081 for VoxPense.

## Where related stuff lives

- Planning + ADRs + state + launch plan: `~/Productivity/hustle/voxpense/` (state.md, play-store.md, decisions.md, design.md, tasks.md, notes.md, archive.md)
- Hi-fi mockups: `~/Productivity/hustle/voxpense/mockups/index.html`
- Server tenant: `~/Projects/server/src/apps/voxpense/v1/`
- Shared backend repo: https://github.com/yashguptadeveloper/server
- OTA system: https://github.com/yashguptadeveloper/ota-server
- Cross-session memory: `~/.claude/projects/-Users-yashgupta/memory/`

## Operating principles

- Design is canonical — code matches design, not the other way
- Pipeline phases gate progression — no skipping phases
- Emulator-validated before APK ships
- User-review-gate before production
- Direct commit to main until v1 — no PR churn for solo dev
