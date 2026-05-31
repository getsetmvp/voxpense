# CLAUDE.md

Context for Claude when working in this repo.

## What this repo is

Voice-first personal expense tracker. Expo mobile app + shared backend tenant. Phase 3 boilerplate ships in this commit; Phase 4 (server tenant) + Phase 5 (parallel feature agents) follow.

## Required reading

- **Repo type**: `frontend-mobile`
- **Type spec**: `~/productivity/standards/frontend-mobile.md`
- **OTA system**: `~/productivity/standards/cloudflare-ota.md`
- **Pipeline**: `~/productivity/standards/app-development-pipeline.md` (10 phases, currently Phase 3)
- **Env files**: `~/productivity/standards/env-files.md`
- **Design (FROZEN)**: `~/productivity/hustle/voxpense/design.md`
- **Hi-fi mockups**: `~/productivity/hustle/voxpense/mockups/index.html` (browser-viewable)

When proposing changes, follow design.md. **The design is FROZEN** — changes require ADR + agent re-scoping.

## Read order on session start

1. `README.md`
2. `CONVENTIONS.md`
3. `~/productivity/hustle/voxpense/design.md` — full spec
4. `~/productivity/hustle/voxpense/design.md` § 19 — Phase 5 partition (which agent owns what)
5. `packages/shared-types/src/index.ts` — DTOs locked
6. `apps/mobile/src/lib/api.ts` — fetch wrapper pattern

## Project layout

```
apps/mobile/
├── app/                          Expo Router pages (Agent A scaffolds, B-E add features)
├── src/
│   ├── lib/
│   │   ├── api.ts                fetch wrapper (DO NOT bypass this)
│   │   ├── auth.ts               signup/login/logout/token storage
│   │   └── theme.ts              (Agent A creates)
│   ├── components/               (Agent A scaffolds, others add)
│   ├── store/                    Zustand stores (Agent A scaffolds shared, B-E add per-feature)
│   └── styles/global.css
├── hooks/
│   └── useOTAUpdates.ts          OTA check on cold start
├── scripts/                      OTA build pipeline
├── certs/
│   └── certificate.pem           PUBLIC cert; safe to commit
├── app.config.js                 dynamic Expo config
├── eas.json                      3 EAS profiles
└── tailwind.config.ts            palette tokens per design.md

packages/shared-types/
└── src/index.ts                  DTOs (mobile ↔ server contract)
```

## Phase 5 agent partition (see design.md § 19)

| Agent | Scope | Branch |
|---|---|---|
| A | Shared contracts (api, auth, theme, navigation, types) | `feat/shared` |
| B | Onboarding + Auth + Profile (screens 01-05, 28) | `feat/onboarding-auth` |
| C | Home + Expenses list + detail + filter (06, 07, 08, 09) | `feat/expenses` |
| D | Capture flows: Voice + Photo + Manual (10-14) | `feat/capture` |
| E | Insights + Budgets + Recurring + Reminders + Settings + Wallets + Cats + Groups (15-27) | `feat/insights-settings` |

**Agent A must complete + merge before B-E start.**

## Conventions (must follow)

- TypeScript strict (`noUncheckedIndexedAccess: true`)
- Functional components only (no class)
- Hooks for state (useState, useReducer) + Zustand for cross-component
- Server state via React Query (in agent C+E scopes) — NOT in Zustand
- Expo Router for navigation (NOT react-navigation directly)
- NativeWind v4 for styling (NOT inline styles, NOT StyleSheet.create except for animated values)
- `expo-secure-store` for tokens (NEVER AsyncStorage)
- All AI calls go through server (`apps/mobile/src/lib/api.ts` → server tenant → ai.askchimps.ai). NEVER call ai.askchimps.ai directly.
- All API calls use `src/lib/api.ts` (auto JWT + refresh). NEVER raw fetch.
- File-based routing only (Expo Router) — pages in `app/`
- Tailwind class order: official prettier-plugin-tailwindcss
- Branch model: `feat/<scope>` per agent (Phase 5) or `<type>/<slug>` general

## Auto-behaviors

- On new feature: identify which agent's scope it belongs to (design.md § 19); branch per agent
- On API call: use `api()` from `src/lib/api.ts`
- On auth-gated screen: check `isAuthed()` from `src/lib/auth.ts`
- On new env var: update `apps/mobile/.env.example` + root `.env.example`

## Critical no-go's

- ❌ Calling `ai.askchimps.ai` directly from the app — go through server tenant
- ❌ Static bearer tokens in source — never
- ❌ AsyncStorage for tokens — use `expo-secure-store`
- ❌ Hardcoded API URLs — use `Constants.expoConfig.extra.apiUrl`
- ❌ Bypassing `api.ts` w/ raw fetch — auto-refresh + auth headers belong in one place
- ❌ Editing `app.config.js` `updates.url` — locked to ota-server pattern
- ❌ Adding to `eas.json` profiles arbitrary channels — only `development` / `preview` / `production`
- ❌ Cross-agent file edits in Phase 5 — respect partition (see design.md § 19)
- ❌ Skipping screen render tests
- ❌ Skipping emulator screenshot in PR
- ❌ Storing user-input PII in client-side logs

## Pitfalls (learned the hard way)

- **NativeWind v4 + Reanimated v3**: ensure `babel-plugin-react-native-reanimated` is LAST in plugin order (already correct in `babel.config.js`)
- **Expo dev client APK install**: must rebuild + reinstall when adding native deps (e.g., new Expo SDK plugin); JS-only changes hot-reload via Metro
- **OTA only ships JS**: Expo SDK upgrade OR `app.config.js` native config changes (icon, splash, permissions) REQUIRE a fresh EAS build
- **runtimeVersion**: locked to `"1.0.0"` in `app.config.js`. Bump only on native rebuild — bumping invalidates older OTA bundles, forcing fresh APK install
- **expo-speech-recognition**: requires both `microphonePermission` AND `speechRecognitionPermission` in `app.config.js` plugin config
- **OTA cert path**: must be relative `./certs/certificate.pem` in `app.config.js`, not absolute

## Where related stuff lives

- Planning + ADRs: `~/productivity/hustle/voxpense/`
- Design (FROZEN): `~/productivity/hustle/voxpense/design.md`
- Hi-fi mockups: `~/productivity/hustle/voxpense/mockups/index.html`
- Server tenant (Phase 4): `~/Projects/server/src/apps/voxpense/v1/`
- OTA server: https://github.com/yashguptadeveloper/ota-server
- Shared backend repo: https://github.com/yashguptadeveloper/server

## Operating principles

- Design is canonical — code matches design, not the other way
- Partition discipline — Phase 5 agents own non-overlapping scopes
- Pipeline phases gate progression — no skipping phases
- Emulator before user — every feature validated on Android emulator before APK ships
- User before production — user review approval required before prod deploy
