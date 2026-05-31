# Conventions

Repo-local rules. Cross-repo standards live in `~/productivity/standards/`.

## Repo classification

| Field | Value |
|---|---|
| Type | `frontend-mobile` |
| Multi-surface | apps/mobile day-1; future apps/web |
| Deploy target | EAS Build → APK + Play Store |
| OTA | Cloudflare via yashguptadeveloper/ota-server |

## Naming

| Rule | Example |
|---|---|
| Tenant id | `voxpense` (lowercase, single word) |
| Branch | `feat/<scope>` per Phase 5 partition OR `<type>/<slug>` (`fix/voice-overflow`, `chore/deps`) |
| Component file | PascalCase (`ExpenseRow.tsx`) |
| Hook file | camelCase prefixed `use` (`useExpenses.ts`) |
| Util file | camelCase (`formatMoney.ts`) |
| Screen file | Expo Router convention (`app/(tabs)/expenses.tsx`, `app/expense/[id].tsx`) |

## Branch model

- `main` is protected
- Branch: `feat/<scope>` per Phase 5 partition OR `<type>/<slug>` for general work
- Conventional Branches types: `feat/`, `fix/`, `docs/`, `chore/`, `refactor/`, `test/`, `perf/`, `build/`, `ci/`
- PR-only merges; squash to main
- Each PR includes emulator screenshot (per pipeline D7)

## Commits

Conventional Commits:
- Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `perf`, `build`, `ci`
- Scopes: feature folder names (`voice`, `expenses`, `ask`, `budgets`, `wallets`, `auth`), or `mobile` / `shared-types` / `infra`

Examples:
- `feat(voice): add waveform animation during recording`
- `fix(api): retry on 401 when refresh token valid`
- `chore(deps): bump expo to 53.0.5`

## Code

- TypeScript strict mode, `noUncheckedIndexedAccess: true`
- Functional components only
- Hooks: `useState`, `useReducer`, custom hooks in `hooks/`
- Cross-component state: Zustand (one store per concern in `src/store/`)
- Server state: React Query (deferred install — Agent C+E add)
- Styling: NativeWind v4 utility classes only
- Icons: `@expo/vector-icons` (Lucide-style) OR `lucide-react-native` (Agent A picks)
- File-based routing only (Expo Router)
- Named exports (no default exports) — easier grep
- `tabular-nums` Tailwind variant on all numeric amounts

## Env file policy

Three-file pattern per `~/productivity/standards/env-files.md`:

| File | Purpose |
|---|---|
| `.env.example` (repo root + apps/mobile) | placeholder contract, committed |
| `.env.dev` | local dev secrets, gitignored, fresh-random |
| `.env.prod` | mirror of canonical prod values, gitignored |

EAS Build secrets configured per profile in `eas.json` `env:` block OR via `eas secret` CLI.

## Per-agent boundaries (Phase 5)

See `~/productivity/hustle/voxpense/design.md` § 19. Each agent owns specific folders. Conflicts resolved by main thread.

## Anti-patterns

- ❌ AsyncStorage for tokens — use `expo-secure-store`
- ❌ Hardcoded server URL — use `Constants.expoConfig.extra.apiUrl`
- ❌ Skipping signature on OTA — `codeSigningCertificate` MUST be set
- ❌ Branch-driven prod (use tag-driven `v*` tags)
- ❌ Direct calls to `ai.askchimps.ai` — go through `api.ts` → server
- ❌ `react-navigation` direct usage — use Expo Router
- ❌ `StyleSheet.create` (use NativeWind classes, except for animated style values)
- ❌ Mixing fetch and axios — fetch is built-in, lib/api.ts uses it
- ❌ Skipping emulator screenshot in PR
- ❌ Reusing OTA version numbers — always monotonic increment

## Documentation

- `README.md` — entry point for humans
- `CLAUDE.md` — entry point for Claude sessions
- `CONVENTIONS.md` — this file
- `~/productivity/hustle/voxpense/design.md` — FROZEN design spec
- `~/productivity/hustle/voxpense/mockups/index.html` — hi-fi mockups

## Testing

- Unit tests (Jest) for non-UI logic (`src/lib/`, helpers)
- Component render tests (RNTL) for screens — smoke render w/o crashes
- Manual emulator smoke for every feature flow before PR merge
- E2E (Detox) deferred to v1.1

## Deploy

OTA path: push to main → preview / tag v* → production (auto via GH Actions).
Native rebuild: `eas build --profile production --platform android` + `eas submit`.
Never deploy from laptop. CI is the only deployer.
