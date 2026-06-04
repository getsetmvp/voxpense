# Changelog

All notable changes to VoxPense. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [SemVer](https://semver.org/).

## [Unreleased]

### Planned (v1.1)

- Live wallet balance computation (currently shows `openingBalance` only).
- Multi-select category / wallet / group filters on the Expenses list.
- Native date-picker on manual entry + expense detail.
- Custom date-range picker on expense filters.
- Gallery picker on the Photo capture screen.
- Swipe-to-delete on expense rows.
- Audio playback in expense detail when `audioKey` is present.
- Push notifications for reminders.
- Conversation history persistence in Ask tab.
- SDK 54 bump.

## [1.0.0] — 2026-06-XX (target)

Initial Play Store release.

### Added

- Voice-first expense capture: tap mic, speak "lunch 320 swiggy", AI parse + categorize.
- Photo receipt capture: snap a receipt, AI extracts amount + merchant.
- Manual expense entry with currency, wallet, category, group, merchant, date, notes.
- Five-tab navigation: Home, Expenses, Ask, Insights, Settings.
- Insights aggregations: spend by category, by day, by wallet, by group; budget progress.
- Ask tab: natural-language query over expenses (server-proxied AI).
- Settings: profile, preferences (theme auto/light/dark, currency default, keep-audio toggle), wallets, categories, groups, budgets, recurring expenses, reminders, privacy & data, about.
- Auth: email + password signup, login, silent token refresh via `expo-secure-store`.
- Privacy controls: data export to JSON via Share sheet; account delete wired to `DELETE /voxpense/v1/users/me`.
- Theme: indigo brand, Inter font, full light + dark mode parity across 22 screens.
- OTA hotfix path via self-hosted Cloudflare Worker + R2 (`runtimeVersion 1.0.0`).
- Crash reporting via Sentry React Native (PII-scrubbed).
- Single APK signing identity, package `com.yashguptadeveloper.voxpense`.

### Fixed (pre-launch hardening)

- White flash on back navigation: child stacks now set `contentStyle.backgroundColor` from theme tokens.
- Android Fabric Pressable layout dropping: all layout-bearing Pressables converted to static-array style form.
- Metro bundle 500s on dev client: `react-native-worklets` declared as a direct dep (nativewind/css-interop hardcodes it).
- `SYSTEM_ALERT_WINDOW` permission stripped from release manifest via custom Expo config plugin (RN 0.79 autolinks it from its debug manifest).
- Privacy & Terms in-app links repointed from defunct `voxpense.app` host to `getsetmvp.com`.

### Known issues

- Wallet balance shows opening balance, not opening − sum(expenses). Tracked for v1.1.
- Gallery picker not yet wired on Photo capture; camera-only for now.
- Conversation history in Ask tab is in-memory only; resets on app restart.
