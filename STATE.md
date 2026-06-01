# VoxPense — Current State

> Last updated: 2026-06-01 (22:40 IST) · Snapshot for any new Claude session picking up this repo.

## TL;DR

- App boots, logs in, renders every screen on emulator + physical Vivo V2437 phone — verified end-to-end this session.
- Code is in good shape: `tsc --noEmit` clean, no FATAL in logcat, light + dark themes both render.
- Two recent fixes that mattered: (1) added `react-native-worklets` as a direct dep (nativewind/css-interop hardcodes its babel plugin, pnpm wouldn't expose it otherwise); (2) wired `contentStyle.backgroundColor` into child Stack layouts to kill a white flash on back navigation.
- Not pushed to `origin/main` yet (auto-mode classifier holds the push). Two unpushed commits sit on local `main`.
- Next milestone: signed preview APK via EAS → daily-use trial → Play Store production. Full sequence in [`PLAYSTORE.md`](./PLAYSTORE.md).

## Pipeline progress

| Phase | Status | Notes |
|---|---|---|
| 1 — Mockups | ✓ done | MVP design at `~/productivity/hustle/voxpense/mockups/index.html` (canonical). Glass mockup at `mockups/index-glass-deprecated.html` is dead. |
| 2 — Standards check | ✓ done | type spec, OTA, env policy, pipeline all locked. |
| 3 — Repo init | ✓ done | monorepo + Expo + NativeWind + OTA wiring + workflows. |
| 4 — Server tenant | ✓ done | `voxpense` tenant live at `https://server.getsetmvp.com/voxpense/v1/*`; Prisma migration applied. |
| 4.5 — VM migrate + smoke | ✓ done | auth / CRUD / AI all round-trip green. |
| 5 — Parallel feature agents | ✓ done | 4 agents (B / C / D / E) + foundation; ~9 k LOC. |
| 6 — Emulator validation | ✓ done | dev client APK built + installed; light + dark + empty + 33-expense seed tested. |
| 6.5 — Mockup-pixel rebuild (glass) | ✓ done (deprecated) | 4 agents rewrote screens against glass mockup; design later abandoned. |
| 6.6 — Pressable static-style sweep | ✓ done | converted 25 files from function-form to static-form Pressable styles (Android Fabric bug). |
| MVP-design rebuild | ✓ done | Entire UI layer rewritten on v0 MVP design language (indigo, flat, Inter). 22 screens working light + dark. |
| SDK 53 ← rolled back from 54 | ✓ done (2026-06-01) | Working tree pinned to `expo ~53.0.0`, `react-native 0.79.6`, `react 19.0.0`, `expo-router 5.1`. SDK 54 attempt deferred until after Play Store. |
| Worklets dep + TS green + back-flash | ✓ done (2026-06-01) | Two commits on local `main`, see "Recent commits" below. |
| 7 — User-review APK | **pending** | Build signed preview APK via EAS, install on phone, daily-use 5–7 days. See [`PLAYSTORE.md`](./PLAYSTORE.md) Phase B. |
| 8 — Production hardening | pending | Sentry RN, UptimeRobot, pg_dump cron, 1Password vault, privacy policy page. Phase C. |
| 9 — Play Console + release | pending | $25 dev account, store listing, internal track, staged rollout. Phases D + E. |

## Recent commits on local `main` (not yet pushed)

```
ef96f9c fix(nav): no white flash on back transition
d822fa2 chore(mobile): SDK 53 rollback + worklets dep + TS green
5cb6ab0 fix(metro): append workspace root to default watchFolders   ← last pushed
```

Push is blocked by the Claude Code auto-mode classifier (direct-to-default-branch needs explicit user OK). To push manually:

```bash
cd ~/Projects/voxpense && git push origin main
```

## Recent fixes worth knowing about

### `react-native-worklets` must be a direct dep

`nativewind@4.2.4` resolves `react-native-css-interop@0.2.4`, whose `babel.js` hardcodes `"react-native-worklets/plugin"` in its plugin list. pnpm only exposes packages declared as direct deps to the workspace `node_modules`. Without `react-native-worklets` in `apps/mobile/package.json`, Babel can't find the plugin and Metro returns HTTP 500 on every bundle request. Dev client launches, hits the dev server, sees the 500, fails silently. Fix is the single-line dep add — do not delete the plugin from css-interop (it's library code) and do not switch nativewind versions just for this. liftfuel sibling repo doesn't hit this because it already declares the dep.

### White flash on back transition

`react-native-screens` paints the native window background (white) for 1–2 frames during slide transitions when the stack hosting the screen does not set `contentStyle.backgroundColor`. The root Stack in `app/_layout.tsx` already had it; the three child stacks (`settings/_layout.tsx`, `(onboarding)/_layout.tsx`, `(capture)/_layout.tsx`) did not. Each child now reads `useTheme()` and passes `contentStyle: { backgroundColor: tokens.bg }` so the themed background carries across both light and dark mode. Verified across 6 captured mid-animation frames on emulator-5556 — no white pixel at any phase of the slide.

### Android Fabric Pressable layout bug (still in force from Phase 6.6)

Android new architecture silently drops layout properties (`flexDirection`, `justifyContent`, `alignItems`, `padding*`, `width`, `height`, `borderRadius`) from function-form Pressable styles:

```tsx
// BREAKS — layout props get dropped on Android newArch:
<Pressable style={({ pressed }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  opacity: pressed ? 0.85 : 1,
})}>

// WORKS — static array form:
<Pressable style={[styles.row, { opacity: 1 }]}>
```

Every layout-bearing Pressable was swept to static-form in Phase 6.6. Foundation `<Button>` also rebuilt to paint background via an absolutely-positioned sibling `<View>` (Android Fabric + elevation can render the host `backgroundColor` transparent). For any new screen, keep `flexDirection`, `justifyContent`, `alignItems`, `padding*`, `width`, `height`, `borderRadius` in `StyleSheet.create` or static inline consts; only `opacity` / `backgroundColor` / `transform` go in the dynamic part — and that dynamic part must return an **array**, not a bare object.

## What's running where

| Surface | Where | How |
|---|---|---|
| Backend (NestJS multi-tenant) | OCI VM `144.24.109.40` → `server.getsetmvp.com` | systemd unit `server-stack` wraps `docker compose up -d`. Postgres + PgBouncer + api container. |
| `voxpense` tenant routes | `https://server.getsetmvp.com/voxpense/v1/{auth,users,wallets,groups,categories,expenses,budgets,recurring,reminders,ai}` | NestJS controllers under `~/Projects/server/src/apps/voxpense/v1/`. |
| OTA system | Cloudflare Workers + R2 | Self-hosted, NOT EAS Update. See `ota-server` repo + `~/productivity/standards/cloudflare-ota.md`. |
| Mobile dev client (emulator) | Android emulator port 5554 (AVD `voxpense_dev`) — and optionally a second QA emulator on 5556 using the `liftfuel` AVD with `-read-only` | App `com.yashguptadeveloper.voxpense` (single package, no `.preview` suffix). |
| Mobile dev client (physical) | Vivo V2437 phone, adb serial `10BF520ZY0002XT`, attached via USB. | Same package `com.yashguptadeveloper.voxpense`. `adb reverse tcp:8081 tcp:8081` so the device can reach Metro at `localhost:8081`. |
| Metro dev server | `http://localhost:8081`, `--dev-client`, `APP_ENV=preview` | Started from `apps/mobile/`. Liftfuel Metro sits on 8082; keep voxpense on 8081 to avoid clashing. |
| Production app (planned) | Play Store, package `com.yashguptadeveloper.voxpense` | Same package; production AAB driven by `APP_ENV=production`. |

## Devices connected (as of last verification)

| Device | adb serial | State |
|---|---|---|
| Emulator (voxpense_dev AVD) | `emulator-5554` | running, voxpense launched, onboarding/home/all tabs verified |
| Emulator (liftfuel AVD, second instance, read-only) | `emulator-5556` | running, voxpense installed + verified, used for QA sweep |
| Physical phone | `10BF520ZY0002XT` (Vivo V2437) | may need re-plug; verified earlier in session |

If a device is missing from `adb devices`, run `adb kill-server && adb start-server` and re-plug.

## Pick up where I left off — exact commands

```bash
# 1. Verify backend is up
curl -sS https://server.getsetmvp.com/voxpense/v1/health
# expect: {"tenant":"voxpense","status":"ok","db":"up"}

# 2. Open the repo
cd ~/Projects/voxpense
git log --oneline -10

# 3. Make sure adb sees the device(s)
~/Library/Android/sdk/platform-tools/adb devices -l
# if phone missing: adb kill-server && adb start-server

# 4. Boot an emulator if none is running
~/Library/Android/sdk/emulator/emulator -avd voxpense_dev -port 5554 -no-snapshot-load -gpu host -no-metrics &
until [ "$(adb -s emulator-5554 shell getprop sys.boot_completed | tr -d '\r')" = "1" ]; do sleep 4; done

# 5. Start Metro on 8081
cd apps/mobile
APP_ENV=preview pnpm exec expo start --dev-client --port 8081 --host lan &

# 6. Per device, wire adb reverse and launch the dev client URL
for SERIAL in emulator-5554 10BF520ZY0002XT; do
  adb -s "$SERIAL" reverse tcp:8081 tcp:8081
  adb -s "$SERIAL" shell am force-stop com.yashguptadeveloper.voxpense
  adb -s "$SERIAL" shell am start -a android.intent.action.VIEW \
    -d 'voxpense://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081'
done

# 7. Log in
# Email:    e2e-1780254222@test.invalid
# Password: test-pass-123
# This user has 33 expenses across 30 days, 3 wallets, 8 categories, 4 budgets, 3 reminders, 3 recurring entries.
```

Notes:

- `adb reverse` works for both emulator and physical phone, so the dev URL stays `localhost:8081` for every device. No need for `10.0.2.2`.
- If `expo start` was already running but stale, kill it (`lsof -ti:8081 | xargs kill`) then restart with `--clear`.
- If a code change doesn't reflect, restart Metro with `--clear`. If that still fails, force-stop the app on-device so the dev client re-fetches the bundle.

## Test user on production server

| Email | Password | Data |
|---|---|---|
| `e2e-1780254222@test.invalid` | `test-pass-123` | 33 expenses, 3 wallets (Cash / HDFC Debit / GPay), 8 categories, 3 groups (Daily / Home / Fun), 4 budgets, 3 reminders, 3 recurring entries. |

## Stack (effective, as of this rollback)

| Layer | Choice |
|---|---|
| Framework | Expo SDK 53 (`expo ~53.0.0`) |
| React Native | `0.79.6` |
| React | `19.0.0` |
| Routing | `expo-router ~5.1.11` |
| Styling | `nativewind ^4.2.4` + `tailwindcss ^3.4` |
| Animation | `react-native-reanimated ~3.17.5` (plugin: `react-native-reanimated/plugin`) |
| Worklets | `react-native-worklets ^0.5.1` (required by `react-native-css-interop`) |
| Bridge | New architecture (Fabric) enabled |
| State | Zustand (auth + theme) + React Query (server state) |
| Auth storage | `expo-secure-store` |
| Voice | `expo-speech-recognition ^1.1.0` (with `src/lib/speechRecognition.ts` Expo Go shim) |
| Camera | `expo-camera ~16.1.11` |
| API client | `src/lib/api.ts` (fetch wrapper + token auto-refresh) |
| Backend | tenant `voxpense` in `~/Projects/server` |
| AI | server-proxied via `ai.askchimps.ai` |
| OTA | Cloudflare Worker + R2 via `ota-server` (NOT EAS Update) |
| Build | EAS Build, 3 profiles (development / preview / production) |
| Error tracking | Sentry RN — planned, not yet wired (env var slot exists) |

SDK 54 bump was committed earlier in repo history (`1ecb1e7`) but rolled back in commit `d822fa2` because `expo-file-system 19` API surface (e.g. `import { File }`) was breaking and several deps weren't ready. Re-attempt the bump only after Play Store ships.

## Architecture map (mobile)

```
apps/mobile/
├── app/                                 Expo Router pages (file-based)
│   ├── _layout.tsx                      providers + AuthGate + nav stack + Inter font loader
│   ├── index.tsx                        splash redirect
│   ├── (onboarding)/                    welcome / login / signup / currency / wallet
│   ├── (tabs)/                          home / expenses / ask / insights / settings   (5 tabs)
│   ├── (capture)/                       voice / photo / manual / confirm
│   ├── expense/[id].tsx                 detail / edit / delete (single screen)
│   └── settings/                        profile / preferences / wallets / categories / groups / budgets / recurring / reminders / privacy / about
├── src/
│   ├── components/ui/                   Foundation primitives — Button / Card / Chip / Input / ListItem / Sheet / Skeleton / Toast / Banner / Amount / ConfirmDialog / EmptyState
│   ├── components/layout/               Screen / Header / SectionHeader / Dots / FabStack
│   ├── components/feature/              ExpenseRow / FilterSheet (composed feature widgets)
│   ├── components/ErrorBoundary.tsx
│   ├── lib/api.ts                       fetch wrapper + auto-refresh (NEVER bypass — every server call goes through here)
│   ├── lib/endpoints.ts                 typed namespaces: auth / users / wallets / groups / categories / expenses / budgets / recurring / reminders / ai
│   ├── lib/format.ts                    currency / date helpers
│   ├── lib/insights.ts                  pure aggregation: groupByCategory, sumByDay, computeBudgetProgress, …
│   ├── store/auth.ts                    Zustand: status / user / hydrate / login / signup / logout / refreshUser
│   ├── queries/expenses.ts              React Query hooks: useExpensesList (infinite) / useExpense / useCreateExpense / useUpdateExpense / useDeleteExpense
│   ├── queries/insights.ts              hooks for categories / wallets / groups / budgets / recurring / reminders + window aggregations + all mutations
│   ├── query/client.ts                  QueryClient + qk registry
│   ├── theme/tokens.ts                  lightTokens + darkTokens (indigo brand, ink / paper / night)
│   ├── theme/ThemeProvider.tsx          useTheme() context + nativewind bridge
│   ├── store/theme.ts                   Zustand: mode (auto / light / dark) + setMode
│   ├── lib/money.ts                     symbolOf / formatMoney / splitMoney
│   ├── lib/currencies.ts                SEED_CURRENCIES catalogue
│   ├── lib/speechRecognition.ts         Expo Go shim for expo-speech-recognition
│   └── styles/global.css                NativeWind entry
├── packages/shared-types/src/index.ts   DTOs mirroring server response shapes (single source of truth mobile ↔ server)
├── app.config.js                        APP_ENV-driven (preview / production / development); single package id; OTA code signing conditional on env
├── app.json                             static config — holds the `eas.projectId` so EAS CLI can read it without executing app.config.js
├── eas.json                             3 EAS profiles
└── android/                             prebuild output (committed)
```

## Conventions in force

- **Pressable styles:** static array-form ONLY for layout-bearing Pressables (see "Android Fabric Pressable layout bug" above).
- **Stack `contentStyle`:** every `Stack` layout must set `contentStyle.backgroundColor` from the theme tokens or back transitions will flash white.
- **Foundation components:** `Screen` / `Header` / `Card` / `Button` / `Input` / `ListItem` / `Sheet` / `Chip` / `Amount` / `Banner` / `EmptyState` / `ConfirmDialog` / `Toast` — all from `src/components/ui` + `src/components/layout`. Never reinvent.
- **Colors:** read from `useTheme().tokens`. Never hardcode hex strings outside `src/theme/tokens.ts` + `tailwind.config.ts`. Brand is indigo `#6366F1` (light) / `#818CF8` (dark).
- **Server state:** React Query, never `useEffect` fetches, never Zustand.
- **Auth state:** Zustand store at `src/store/auth.ts`. Token lives in `expo-secure-store` (never AsyncStorage).
- **Server URL:** read from `Constants.expoConfig.extra.apiUrl`. Default `https://server.getsetmvp.com`. Tenant always `voxpense`.
- **`expenses` API `limit`:** ≤ 200 (server caps). `useInsightsWindow` + `useBudgetProgress` already enforce this — match it for any new aggregation query.
- **Pixel-target:** every screen mirrors `~/productivity/hustle/voxpense/mockups/index.html` (MVP visual language — flat solid cards, indigo brand, Inter font).
- **Commits:** Conventional Commits. Direct-to-`main` until v1 ships.

## What's deferred to v1.1+

- Live wallet balance computation (currently shows `openingBalance` only).
- Multi-select category / wallet / group filters on the Expenses list (server contract takes single id today — would need `category_ids[]` etc.).
- Native date-picker on manual entry + expense detail (`@react-native-community/datetimepicker` was removed; text input fallback is in place).
- Custom date-range picker on expense filters.
- Gallery picker on the Photo capture screen (`expo-image-picker`).
- Swipe-to-delete on expense rows.
- Audio playback in expense detail when `audioKey` is present (needs a server-side signed-URL endpoint).
- PgBouncer auth-mode fix (current bypass: api → postgres direct).
- SDK 54 bump (rolled back in this session — retry post-launch).

Tracked in `~/productivity/hustle/voxpense/tasks.md` under P2.

## Known typecheck / lint state

- `pnpm exec tsc --noEmit` → 0 errors as of commit `d822fa2`.
- ESLint: not yet run end-to-end this session; `pnpm exec expo lint` should be clean post-fixes.
- Jest: `pnpm test` passes with no test files (`--passWithNoTests`). No unit tests written yet; P2 backlog item.

## Common gotchas

- **Bundle cache.** If a code change doesn't reflect after force-stop + restart, kill Metro and start with `--clear`.
- **Dev menu modal blocks taps.** When the dev launcher's overlay appears (e.g. after launching via the deep-link), `adb shell input keyevent KEYCODE_BACK` dismisses it; only then is the underlying app focusable.
- **Two emulators at once.** RN AVDs lock by default. Clone an AVD or use a second AVD with `-read-only` for the second instance.
- **Metro 8081 vs 8082.** Liftfuel's Metro typically squats 8082; keep voxpense on 8081.
- **`adb` daemon often needs a restart** before the physical phone shows up. `adb kill-server && adb start-server` then re-run `adb devices`.
- **`@` in `adb shell input text`** is not supported; send it with `adb shell input keyevent 77` instead.

## Where related stuff lives

- Planning + ADRs + design: `~/productivity/hustle/voxpense/`
- Hi-fi mockups (28 screens, browser-viewable HTML): `~/productivity/hustle/voxpense/mockups/index.html`
- Server tenant code: `~/Projects/server/src/apps/voxpense/v1/`
- Server tenant migration: `~/Projects/server/prisma/voxpense/migrations/`
- OTA infrastructure: https://github.com/yashguptadeveloper/ota-server
- Auto-memory notes (cross-session context): `~/.claude/projects/-Users-yashgupta-Productivity/memory/`
- Older `~/Apps/voxpense/` clone exists — outdated SDK 52, do not edit.
- Sibling repo for reference: `~/Projects/liftfuel/` (already on SDK 54; voxpense diverges intentionally).

## Next steps

See [`PLAYSTORE.md`](./PLAYSTORE.md) for the sequenced plan from current state to a live Play Store listing.
