# Voxpense Privacy Policy

**Last updated:** 2026-06-04

Voxpense ("the app") is a personal expense tracker developed and operated by Yash Gupta ("we", "us"). This policy explains what data the app collects, how it is stored, who it is shared with, and how to delete it.

Contact: **yash.gupta.developer@gmail.com**

## 1. Data we collect

When you create a Voxpense account we collect:

- **Email address** (required) — used as your login identifier and for account recovery.
- **Display name** (optional) — shown in the app UI; you may leave it blank.
- **Expense entries you create** — amount, currency, category, wallet, group, merchant, date, free-text notes, and optionally an attached photo or short voice recording transcript.

Voxpense **does not** collect:

- Your location.
- Your contacts.
- Your device advertising ID.
- Your browsing history.
- Any third-party app data.
- Any biometric data.

## 2. How voice and photo capture work

Voxpense lets you log an expense by speaking ("lunch 320 swiggy") or by photographing a receipt.

- **Voice:** the device's on-device speech recognizer converts your speech to text locally. Only the resulting text is sent to our server for parsing. Raw audio is **not** uploaded unless you explicitly enable "Keep voice audio" in Preferences — in which case the audio file is stored on your device only and never leaves it.
- **Photo:** the receipt image is sent to our server, which forwards it to an AI parsing service to extract amount + merchant. The image is retained on our server only as long as needed to render it in the app's expense detail screen, and is deleted on account deletion.

The microphone and camera permissions are requested only at the point of use and can be revoked at any time in your device's OS settings.

## 3. Where data is stored

Your data is stored on a server operated by us:

- **Provider:** Oracle Cloud Infrastructure VM, region `Mumbai (ap-mumbai-1)`.
- **Database:** PostgreSQL, scoped to a per-tenant `voxpense` schema.
- **Transport:** all client ↔ server traffic uses HTTPS (TLS 1.2+).
- **At rest:** database disk volumes are encrypted by the cloud provider.

We do not use any third-party analytics, advertising, or marketing SDKs.

## 4. Third parties

We share data with the following sub-processors only:

| Sub-processor | Purpose | Data shared |
|---|---|---|
| Sentry (`sentry.io`) | Crash reporting | Stack traces, device model, OS version, app version. **No PII** (no email, no expense content). Personally-identifying values are scrubbed before send. |
| AI parsing service (server-side) | Voice text parsing, receipt OCR | The raw user utterance text or receipt image. The provider does not retain or train on this data per its terms. |

We do not sell or rent your data. We do not share it with advertisers.

## 5. Your rights

You may at any time:

- **Export your data:** in-app, `Settings → Privacy & data → Export data`. Produces a JSON file of your most recent expenses you can save anywhere.
- **Delete your account:** in-app, `Settings → Privacy & data → Delete account`. This call triggers `DELETE /voxpense/v1/users/me` on our server, which marks your account for deletion and wipes all rows tied to your user ID within 7 days (including expenses, photos, voice transcripts, wallets, categories, groups, budgets, reminders, and recurring entries). Server-side backups are purged on a rolling 30-day window.
- **Request a copy of any data we hold on you:** email yash.gupta.developer@gmail.com.
- **Correct inaccurate data:** edit it directly in the app, or email us.

## 6. Retention

- Active account data: retained as long as the account exists.
- Deleted account data: erased from primary database within 7 days; erased from backups within 30 days.
- Crash reports (Sentry): 90-day rolling retention.

## 7. Children's privacy

Voxpense is not directed to children under 18 and we do not knowingly collect data from them. If you believe a child has provided us data, contact yash.gupta.developer@gmail.com and we will delete it.

## 8. Security

- TLS in transit, encryption at rest.
- Passwords are stored hashed (bcrypt).
- Auth tokens (JWT, short-lived) are kept in the device secure enclave (`expo-secure-store`), never in plain `AsyncStorage`.
- Server access is restricted to the developer; no third-party operator has shell access to the database.

We cannot guarantee absolute security; no online service can. We commit to disclosing any confirmed breach affecting your data within 72 hours of confirmation, via email to the address on file.

## 9. International transfers

Our server is hosted in India (Mumbai). If you use the app from outside India, your data will be transferred to and stored in India. We do not transfer data to any other jurisdiction.

## 10. Changes to this policy

We will update the "Last updated" date above when we change this policy. Material changes will be surfaced in-app via a notice on next launch.

## 11. Contact

Questions, requests, or complaints: **yash.gupta.developer@gmail.com**.

Postal address available on request.
