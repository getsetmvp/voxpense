# VoxPense → Play Store

> Sequenced plan from current state (2026-06-01) to a live Play Store production listing. Designed so any new Claude session can pick this up cold and keep moving.

## TL;DR

Code is feature-complete and stable on emulator + physical phone. What stands between today and "user installs production build from Play Store":

1. Ship the two unpushed commits.
2. Build a signed preview APK via EAS and daily-use it on a real phone for 5–7 days.
3. Wire crash reporting + uptime + backups in parallel.
4. Buy a Google Play Developer account ($25 one-time) and prep the Play Console listing.
5. Tag `v1.0.0`, build a production AAB, submit to internal track, soak, promote.

Realistic target: **Play Store production-live by 2026-06-14** (13 days from today). Critical path is the Google Play Developer identity review (~48 hours), so start step 9 on Day 0.

---

## Phase 0 — Repo handshake (5 minutes)

| Step | What |
|---|---|
| 0.1 | `cd ~/Projects/voxpense && git status && git log --oneline -10` — confirm you are on `main`, two unpushed commits visible: `ef96f9c fix(nav): no white flash on back transition` and `d822fa2 chore(mobile): SDK 53 rollback + worklets dep + TS green`. |
| 0.2 | Read [`STATE.md`](./STATE.md) for the current shape of the world. |
| 0.3 | `git push origin main` — requires explicit user OK; the Claude Code auto-mode classifier blocks direct-to-default-branch otherwise. |
| 0.4 | Verify the backend is still up: `curl -sS https://server.getsetmvp.com/voxpense/v1/health` → expects `{"tenant":"voxpense","status":"ok","db":"up"}`. |
| 0.5 | Confirm running app on a device using the commands in `STATE.md` → "Pick up where I left off". |

---

## Phase A — Final pre-build cleanup (already done in this session)

Done. Worklets dep added, 7 TS errors fixed, metro.config reverted to keep Expo defaults, back-flash patched. Commits live on local `main` waiting for push. Skip unless something regresses.

---

## Phase B — Signed preview APK + on-phone trial (Days 1 – 7)

Goal: a real APK on Yash's phone that's not a dev client. Daily use to find hardware-only bugs (voice STT, camera, AI receipt parse, OTA fetch, push refresh under bad networks).

### B1. EAS account + project link

```bash
pnpm dlx eas-cli@latest login
cd ~/Projects/voxpense/apps/mobile
# Project is already linked: eas.projectId = b20d6563-81c8-4401-a4df-2ff549a01ede in app.json.
# Verify:
eas init --id b20d6563-81c8-4401-a4df-2ff549a01ede
```

### B2. EAS secrets

Anything sensitive that needs to be in the bundle but should not live in `.env.prod`:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value <Sentry DSN, generated in C1>
eas secret:create --scope project --name OTA_SERVER_URL --value https://ota-server.yashguptadeveloper.workers.dev
```

`EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_TENANT` are already encoded in `eas.json` under each profile's `env` block.

### B3. Build the preview APK

```bash
cd ~/Projects/voxpense/apps/mobile
eas build --profile preview --platform android --non-interactive
```

This produces an APK (not an AAB — the `preview` profile uses `buildType: "apk"`). EAS hosts the artifact at a one-shot URL when it finishes.

### B4. Install on the phone

Three ways, pick one:

- Scan the EAS QR code in the build's web page → install via browser.
- `eas build:run --platform android --latest` (downloads + installs to the connected device).
- `adb -s 10BF520ZY0002XT install -r <downloaded APK path>`.

### B5. Daily use trial (5 – 7 days)

Capture a log file at `~/Projects/voxpense/notes.md` per real-world run. Must validate, on the physical phone, things that don't show up in the emulator:

| Surface | What to confirm |
|---|---|
| Voice STT | Tap mic FAB → speak "lunch 320 swiggy" → "(capture)/confirm" pre-fills correctly. |
| Photo OCR | Photo FAB → snap a real receipt → AI parse pre-fills amount + merchant. |
| Camera permissions | Cold-start prompt fires; deny + re-grant flow works. |
| Mic permissions | Same. |
| Auth refresh | Force-close + cold-start with a stale token → silent refresh, no logout. |
| Network drop | Airplane mode mid-action → graceful error toast, no crash. |
| OTA fetch | After publishing an OTA bundle (B7), cold-start picks up the new JS. |
| Theme auto | Switch system theme dark ↔ light → app follows. |
| Edge-to-edge | Status bar + nav bar respect insets. |
| Push notifications | Not yet wired — skip; v1.1. |

Bugs go into `notes.md` with severity. Fix P1 immediately (push to `main`, re-build APK). Defer P2 to v1.1 backlog.

### B6. Validate the OTA path

```bash
cd ~/Projects/voxpense/apps/mobile
APP_ENV=preview pnpm ota:publish
```

That bundles, signs, and uploads to R2. Cold-start the phone APK → it should fetch the new manifest from the Cloudflare Worker and apply the JS. This proves the production hotfix mechanism works before you ever submit to the Play Store.

### B7. Exit criteria

- 5+ days of real use with no P1 bugs left open.
- Voice + camera + AI receipt all green on real hardware.
- OTA fetch verified.

---

## Phase C — Production hardening (Days 4 – 10, runs in parallel with B)

These all unblock submitting to the Play Store. None should block the preview APK build.

### C1. Sentry React Native

```bash
cd ~/Projects/voxpense/apps/mobile
pnpm add @sentry/react-native
npx @sentry/wizard@latest -i reactNative -p android
```

Wizard injects native config + a wrapper around the root component. After it finishes:

- Move the DSN out of `.env.prod` into the `EXPO_PUBLIC_SENTRY_DSN` EAS secret (B2).
- Confirm `sourcemap.upload` runs in EAS production builds (the wizard adds this).
- Trigger a hand-crafted crash (`throw new Error('sentry-smoke')` behind a hidden long-press) and verify it shows up in the Sentry dashboard.

### C2. UptimeRobot

Add an HTTPS keyword monitor on `https://server.getsetmvp.com/voxpense/v1/health` looking for `"status":"ok"`. 5-minute interval. Email alert. Optional SMS.

### C3. Database backups (on the OCI VM)

SSH into `144.24.109.40`. Add to root crontab:

```cron
0 3 * * *  pg_dump voxpense_db | gzip > /backups/voxpense/$(date +\%F).sql.gz
30 3 * * * find /backups/voxpense -mtime +30 -delete
0 4 * * 0  rclone copy /backups/voxpense oci-objectstorage:voxpense-backups
```

(Use `rclone` against OCI Object Storage if configured; otherwise restic / borg / a second VM. Mention path in `STATE.md`.)

### C4. 1Password vault entries

Mirror these secrets into a `voxpense` vault item per secret:

- OTA private key (`apps/mobile/certs/private-key.pem` — generated at OTA setup, NEVER in git).
- JWT signing secret (currently in `/srv/server/.env` on the VM).
- Postgres `voxpense_db` password.
- EAS access token (for headless CI).
- Google Play service account JSON (after step D2).
- Sentry auth token.

### C5. Privacy policy page

Required by the Play Store. Host at `https://getsetmvp.com/privacy/voxpense`. Minimum content (write in plain English):

- App name + developer + contact email `yash.g@pei.group`.
- What data is collected: email, name (optional), expense entries the user creates.
- What is NOT collected: location, contacts, device id, ads identifiers.
- How data is stored: on Yash's own server, encrypted in transit (TLS), Postgres on OCI VM.
- Third parties: Sentry (crash reports only, no PII). No analytics SDK.
- How a user deletes their account: in-app `Settings → Privacy → Delete account` (already wired to `DELETE /voxpense/v1/users/me`).
- Retention: account-delete also wipes all server data within 7 days.
- Children's policy: 18+.
- Last updated date.

A Markdown file at `docs/privacy-policy.md` plus a Cloudflare Pages deploy is fine. The Play Console only needs the public URL.

---

## Phase D — Play Console setup (Days 7 – 10)

### D1. Buy the Google Play Developer account

- Go to https://play.google.com/console/signup.
- $25 one-time fee.
- Provide government ID — Aadhaar / passport scan.
- Identity review takes ~48 hours.
- **Start this on Day 0 in parallel with everything else.** It is the slowest dependency.

### D2. Service account for `eas submit`

1. In the Play Console, link a Google Cloud project (it'll prompt automatically).
2. In that GCP project, create a service account named `eas-publisher`.
3. Generate a JSON key for it.
4. Back in Play Console → Setup → API access → grant the service account `Release Manager` (or just the "App: Manage releases" permission) on the voxpense app.
5. Save the JSON locally at `apps/mobile/play-service-account.json` (this path is already referenced in `eas.json` and gitignored).
6. Mirror the JSON into 1Password.

### D3. Create the app in Play Console

- Package: `com.yashguptadeveloper.voxpense`.
- App name: `VoxPense`.
- Default language: English (India).
- App or game: App.
- Free or paid: Free.
- Category: Finance.
- Tags: Budgeting, Personal finance.

### D4. Mandatory listing forms

| Form | What to fill |
|---|---|
| Content rating | Run the questionnaire — no violence / no UGC / collects email = ESRB E / IARC 3+. |
| Target audience | 18 and up. |
| Data safety | Declare: email + expense data collected. Encrypted in transit. User can delete. No data shared with third parties (Sentry is "for analytics" but PII-free; declare conservatively). |
| App access | Provide `e2e-1780254222@test.invalid / test-pass-123` so Google reviewers can sign in. |
| Ads | None. |
| News app | No. |
| Government / health | No. |
| COVID-19 | No. |
| Financial features | "Personal finance management" — yes; lending / payments / crypto — no. |

### D5. Store listing assets

Build these once, reuse for every release:

| Asset | Spec | Source |
|---|---|---|
| App icon | 512 × 512 PNG, no alpha | `apps/mobile/assets/images/icon.png` (verify size, export if needed). |
| Feature graphic | 1024 × 500 PNG, no transparency | New asset — design one in Figma; brand indigo, sparkles logo, tagline "Track expenses by talking." |
| Phone screenshots | ≥ 2 images, 16:9 or 9:16, ≥ 320 px on shortest side, no chrome | Capture from emulator — Home (light), Insights (light), Capture flow, Expense detail (dark). At least one light + one dark. |
| Short description | ≤ 80 chars | "Speak your expenses. We auto-categorize, budget, and answer questions." |
| Full description | ≤ 4000 chars | Paste from `~/productivity/hustle/voxpense/store-listing.md` (write this file). Include features list, privacy stance, contact. |
| Privacy policy URL | Public URL from C5 | `https://getsetmvp.com/privacy/voxpense`. |

---

## Phase E — Production release (Days 10 – 14)

### E1. Tag the release

```bash
cd ~/Projects/voxpense
git tag v1.0.0 -m "v1.0.0 — initial Play Store release"
git push --tags
```

### E2. Build the production AAB

```bash
cd ~/Projects/voxpense/apps/mobile
eas build --profile production --platform android --non-interactive
```

This uses the `production` EAS profile (`buildType: "app-bundle"`). Output is an AAB hosted by EAS.

### E3. Publish the OTA baseline (matching `runtimeVersion 1.0.0`)

```bash
cd ~/Projects/voxpense/apps/mobile
APP_ENV=production pnpm ota:publish
```

Ensures the production app on launch can immediately pick up an OTA bundle if you publish a hotfix.

### E4. Submit to the internal track

```bash
cd ~/Projects/voxpense/apps/mobile
eas submit --profile production --platform android --latest
```

This uses the service account JSON from D2 to upload the latest AAB to the Play Console's `internal` track.

### E5. Add internal testers

In Play Console → Internal testing → Testers → add Yash's email (and 1–2 trusted others). The console gives an opt-in URL. Install via that URL on the phone.

### E6. 24-hour soak

- Yash uses the production-track app for a day.
- Confirm Sentry zero-crash, OTA path works, login + capture + insights all green.

### E7. Promote to production

Inside Play Console, on the same build, click "Promote release":

1. Promote from `internal` → `closed (alpha)` if you want a few extra testers (skip if confident).
2. Promote → `open (beta)` if you want public opt-in (skip if confident).
3. Promote → `production` with a **staged rollout** of 20 %.
4. Watch Sentry + Play Vitals (`Crashes & ANRs`, `Excessive wakeups`, etc.) for 24 – 48 hours.
5. If green: bump to 100 %.
6. If a regression appears: halt the rollout from Play Console and ship an OTA hotfix (`pnpm ota:publish`) — no resubmit needed for JS-only fixes.

---

## Phase F — Post-launch (Day 14+)

| Task | Cadence |
|---|---|
| Sentry triage | Daily for the first 2 weeks, weekly thereafter. |
| Play Vitals review | Weekly. |
| OTA hotfix path | Use for any JS-only bug fix. Increment `runtimeVersion` only for native changes (new dep, SDK bump, icon change). |
| User feedback | Pipe Play Console reviews into `~/productivity/hustle/voxpense/feedback.md` weekly. |
| v1.1 scope | Live wallet balance, multi-select filters, native date picker, gallery picker on photo capture, swipe-to-delete, audio playback in detail, conversation history persistence, smoother charts, OCR benchmark, SDK 54 retry. |

---

## What can be cut to ship faster (−3 days)

| Cut | Trade-off |
|---|---|
| Skip Sentry | Ship blind. Add via OTA in v1.0.1 (Sentry RN can mostly be added as a JS-only change). Not recommended. |
| Skip backups | Not user-visible. Add post-launch. Acceptable risk for week 1. |
| Skip closed / open tracks | Internal → production directly. Acceptable for a personal launch. |
| Skip OTA baseline | Ship pure AAB. Add OTA in v1.0.1 via Play resubmit. Loses the hotfix capability for ~1 week. Not recommended. |
| Skip privacy policy page | **NOT possible** — Play Store rejects submissions without one. |
| Skip Play Developer account | **NOT possible** — gating dependency. |

---

## Fastest realistic timeline

| Day | Milestone |
|---|---|
| 0 | Repo clean, TS green, commits pushed (Phase 0). Play Developer account purchase started. Privacy policy drafted. |
| 1 | EAS preview APK on phone. Sentry wired. |
| 2 – 6 | Daily-use trial. Bug fixes via push + EAS rebuild. UptimeRobot + backups landed in parallel. |
| 7 | Play account approved (~48 h after Day 0 application). App created in Play Console, store listing filled, screenshots captured. |
| 8 | Production AAB built. `eas submit` to internal track. |
| 9 – 10 | Internal soak. |
| 11 | Promote to production at 20 % staged rollout. |
| 13 | 100 % rollout. |
| 14+ | Phase F (post-launch). |

Target: **production-live by 2026-06-14**. Matches `~/productivity/hustle/voxpense/tasks.md` P1 deadline (2026-06-20) with a 6-day buffer.

---

## Quick reference — commands you'll run repeatedly

```bash
# Backend health
curl -sS https://server.getsetmvp.com/voxpense/v1/health

# Metro for dev
cd ~/Projects/voxpense/apps/mobile
APP_ENV=preview pnpm exec expo start --dev-client --port 8081 --host lan --clear

# Launch dev client on a device
adb -s <serial> reverse tcp:8081 tcp:8081
adb -s <serial> shell am force-stop com.yashguptadeveloper.voxpense
adb -s <serial> shell am start -a android.intent.action.VIEW \
  -d 'voxpense://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081'

# Preview APK (EAS-hosted)
eas build --profile preview --platform android --non-interactive

# Production AAB
eas build --profile production --platform android --non-interactive

# OTA push (preview)
APP_ENV=preview pnpm ota:publish

# OTA push (production)
APP_ENV=production pnpm ota:publish

# Submit latest production build to Play Console
eas submit --profile production --platform android --latest

# Typecheck + lint
pnpm exec tsc --noEmit
pnpm exec expo lint
```
