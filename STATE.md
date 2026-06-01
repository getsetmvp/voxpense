# VoxPense — Current State

> Last updated: 2026-06-01 · Snapshot for any new Claude session picking up this repo.

## Pipeline progress

| Phase | Status | Notes |
|---|---|---|
| 1 — Mockups | ✓ done | `~/productivity/hustle/voxpense/mockups/index.html`, 28 phone frames |
| 2 — Standards check | ✓ done | type spec, OTA, env policy, pipeline all locked |
| 3 — Repo init | ✓ done | monorepo + Expo SDK 53 + NativeWind + OTA wiring + workflows |
| 4 — Server tenant | ✓ done | `voxpense` tenant live at `https://server.getsetmvp.com/voxpense/v1/*`; Prisma migration applied |
| 4.5 — VM migrate + smoke | ✓ done | auth/CRUD/AI all round-trip green |
| 5 — Parallel feature agents | ✓ done | 4 agents (B/C/D/E) + foundation; ~9k LOC |
| 6 — Emulator validation | ✓ done | dev client APK built + installed; light + dark + empty + 33-expense seed tested |
| 6.5 — Mockup-pixel rebuild | ✓ done | 4 agents (J/K/L/M) rewrote every screen to match mockup HTML; ~20 fix commits |
| 6.6 — Pressable static-style sweep | ✓ done | Agent N converted 25 files from function-form to static-form Pressable styles (Android Fabric bug) |
| 7 — User review APK | pending | next: `eas build --profile preview --platform android`, install on phone, daily use 5-7 days |
| 8-9 — Production release | pending | tag `v1.0.0` → production AAB + Play Console internal track |

## The big bug that took most of the back-and-forth

**Android Fabric (newArch) silently drops layout properties from function-form Pressable styles.**

```tsx
// BREAKS on Android newArch — flexDirection / justifyContent / alignItems get dropped:
<Pressable style={({ pressed }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  opacity: pressed ? 0.85 : 1,
})}>

// WORKS — static array form preserves layout:
<Pressable style={[styles.row, { opacity: 1 }]}>
```

Phase 6.6 converted **every** Pressable in the app to static-form. Foundation `<Button>` also rebuilt to paint its background via an absolutely-positioned sibling `<View>` instead of relying on the host Pressable's `backgroundColor` (Android newArch + elevation makes the host bg render transparent in some cases).

**Rule for any new screen:** never put `flexDirection`, `justifyContent`, `alignItems`, `padding*`, `width`, `height`, or `borderRadius` inside a `style={({pressed}) => ({...})}` return on a Pressable. Move them to `StyleSheet.create` or inline static `const`, and keep only `opacity` / `backgroundColor` / `transform` in the dynamic part — and even then, return an **array**, not a bare object.

## What's running where

| Surface | Where | How |
|---|---|---|
| Backend (NestJS multi-tenant) | OCI VM `144.24.109.40` → `server.getsetmvp.com` | systemd unit `server-stack` wraps `docker compose up -d`. Postgres + PgBouncer + api container. |
| `voxpense` tenant routes | `https://server.getsetmvp.com/voxpense/v1/{auth,users,wallets,groups,categories,expenses,budgets,recurring,reminders,ai}` | NestJS controllers under `~/Projects/server/src/apps/voxpense/v1/` |
| OTA system | Cloudflare Workers + R2 | Self-hosted, NOT EAS Update. See `ota-server` repo + `~/productivity/standards/cloudflare-ota.md` |
| Mobile dev client | Local Android emulator (Pixel API 34) | `voxpense_dev` AVD (cloned from `liftfuel`) on port 5556 with `-read-only`. App = `com.yashguptadeveloper.voxpense.preview`. |
| Mobile production app | Future (Phase 9) | `com.yashguptadeveloper.voxpense` — same codebase, different `APP_ENV=production` |

## Pick up where I left off — exact commands

```bash
# 1. Verify backend is still up
curl -sS https://server.getsetmvp.com/voxpense/v1/health
# expect: {"tenant":"voxpense","status":"ok","db":"up"}

# 2. Open the repo
cd ~/Projects/voxpense
git log --oneline -10  # see Phase 6.6 commits

# 3. Boot the dev emulator (port 5556 — separate from any other emu you may have running)
~/Library/Android/sdk/emulator/emulator -avd voxpense_dev -port 5556 -read-only -no-snapshot-load -no-boot-anim -gpu host -no-metrics &
# Wait for "boot completed" via:
until [ "$(adb -s emulator-5556 shell getprop sys.boot_completed | tr -d '\r')" = "1" ]; do sleep 4; done

# 4. Start Metro on 8081 (separate port from any other expo instance)
cd apps/mobile
APP_ENV=preview pnpm exec expo start --dev-client --port 8081 --host lan &

# 5. Launch the app pointed at Metro
adb -s emulator-5556 shell am start -a android.intent.action.VIEW \
  -d "exp+voxpense-preview://expo-development-client/?url=http%3A%2F%2F10.0.2.2%3A8081" \
  com.yashguptadeveloper.voxpense.preview

# 6. Test login
# Email: e2e-1780254222@test.invalid   Password: test-pass-123
# This user has 33 expenses across 30 days, 3 wallets, 8 categories, 4 budgets, 3 reminders, 3 recurring entries.
```

If the dev APK isn't installed on the emulator yet:

```bash
cd ~/Projects/voxpense/apps/mobile
adb -s emulator-5556 install -r android/app/build/outputs/apk/debug/app-debug.apk
# OR rebuild from source: APP_ENV=preview pnpm exec expo run:android --device emulator-5556
```

## Test users on production server

| Email | Password | Data |
|---|---|---|
| `e2e-1780254222@test.invalid` | `test-pass-123` | 33 expenses, full feature seed |

## Architecture map (mobile)

```
apps/mobile/
├── app/                                 Expo Router pages (file-based)
│   ├── _layout.tsx                      providers + AuthGate + nav stack
│   ├── index.tsx                        splash redirect
│   ├── (onboarding)/                    welcome / login / signup    (Phase 5 Agent B, rebuilt by Agent J in 6.5)
│   ├── (tabs)/                          home / expenses / insights / settings   (J + L + M)
│   ├── (capture)/                       voice / photo / manual / confirm   (K)
│   ├── expense/[id].tsx                 detail/edit/delete   (C + J)
│   └── settings/                        profile / preferences / wallets / categories / groups / budgets / recurring / reminders / privacy / about   (B + E + M)
├── src/
│   ├── components/glass/                FOUNDATION — Screen / Card / Button / Input / Sheet / States / Stub   (locked, do not regress)
│   ├── components/auth/                 AuthTopBar / AuthSegmented / AuthField / FormBanner
│   ├── components/home/                 Chip / WeekSparkline
│   ├── components/expense/              ExpenseRow / FilterSheet / FilterPills / Fab / AmountDisplay / EmptyExpenses / grouping
│   ├── components/capture/              MicButton / Waveform / CaptureHeader / PickerSheet
│   ├── components/insights/             MetricTile / DonutChart / BarChart / AskInput
│   ├── components/settings/             NavRow / SectionGroup / ScreenHeader / FAB / ColorSwatchPicker / IconPicker / SegmentedControl
│   ├── lib/api.ts                       fetch wrapper + auto-refresh   (NEVER bypass — every server call goes through here)
│   ├── lib/endpoints.ts                 typed namespaces: auth / users / wallets / groups / categories / expenses / budgets / recurring / reminders / ai
│   ├── lib/format.ts                    currency / date helpers
│   ├── lib/insights.ts                  pure aggregation: groupByCategory, sumByDay, computeBudgetProgress, etc.
│   ├── store/auth.ts                    Zustand: status / user / hydrate / login / signup / logout / refreshUser
│   ├── queries/expenses.ts              React Query hooks: useExpensesList (infinite) / useExpense / useCreateExpense / useUpdateExpense / useDeleteExpense
│   ├── queries/insights.ts              hooks for categories / wallets / groups / budgets / recurring / reminders + window aggregations + all mutations
│   ├── query/client.ts                  QueryClient + qk registry
│   ├── theme/tokens.ts                  spacing / radii / motion / shadows
│   └── styles/global.css                NativeWind entry
├── packages/shared-types/src/index.ts   DTOs mirroring server response shapes (single source of truth mobile ↔ server)
└── app.config.js                        APP_ENV-driven (preview / production / development); OTA code signing conditional on env
```

## Conventions in force

- **Pressable styles:** static array-form ONLY for layout-bearing Pressables. (See "the big bug" above.)
- **Foundation components:** `Screen` / `Card` / `Button` / `Input` / `Sheet` / `LoadingView` / `EmptyView` / `ErrorView` — all from `src/components/glass`. Never reinvent.
- **Server state:** React Query, never `useEffect` fetches, never Zustand.
- **Auth state:** Zustand store at `src/store/auth.ts`. Token lives in `expo-secure-store` (never AsyncStorage).
- **Server URL:** read from `Constants.expoConfig.extra.apiUrl`. Default `https://server.getsetmvp.com`. Tenant always `voxpense`.
- **`expenses` API `limit`:** ≤ 200 (server caps). `useInsightsWindow` + `useBudgetProgress` already enforce this — match it for any new aggregation query.
- **Pixel-target:** every screen mirrors `~/productivity/hustle/voxpense/mockups/index.html`. The mockup file shares the same `tailwind.config.ts` palette, so className strings map 1:1.
- **Commits:** Conventional Commits. Direct-to-`main` until v1 ships (see `~/.claude/.../memory/feedback_voxpense_direct_main.md` for why).

## What's deferred to v1.1+

- Live wallet balance computation (currently shows `openingBalance` only)
- Multi-select category/wallet/group filters on the Expenses list (server contract takes single id today — would need `category_ids[]` etc.)
- Custom date-range picker on expense filters (would need `@react-native-community/datetimepicker`)
- Gallery picker on the Photo capture screen (would need `expo-image-picker`)
- Swipe-to-delete on expense rows
- Audio playback in expense detail when `audioKey` is present (needs a server-side signed-URL endpoint)
- PgBouncer auth-mode fix (current bypass: api → postgres direct)

Tracked in `~/productivity/hustle/voxpense/tasks.md` under P2.

## Common gotchas

- **Bundle cache:** if a code change doesn't reflect after force-stop + restart, restart Metro with `--reset-cache`.
- **Code signing in dev:** the dev-client APK has the production OTA cert baked into its `AndroidManifest.xml`. If the cert doesn't have the right `keyUsage` extension, the dev client rejects unsigned manifests from Metro. We strip `CODE_SIGNING_*` meta-data from the AndroidManifest at build time for development. See the `chore(mobile): sync deps to Expo SDK 53` commit.
- **Two emulators at once:** RN AVDs lock by default. Clone the AVD dir + use `-read-only` on the second instance to multi-boot.
- **Metro 8081 vs 8082:** the user has been running a parallel expo instance on 8082. Use 8081 for dev to avoid clashing.

## Where related stuff lives

- Planning + ADRs + design: `~/productivity/hustle/voxpense/`
- Hi-fi mockups (28 screens, browser-viewable HTML): `~/productivity/hustle/voxpense/mockups/index.html`
- Server tenant code: `~/Projects/server/src/apps/voxpense/v1/`
- Server tenant migration: `~/Projects/server/prisma/voxpense/migrations/`
- OTA infrastructure: https://github.com/yashguptadeveloper/ota-server
- Auto-memory notes (cross-session context): `~/.claude/projects/-Users-yashgupta/memory/`
