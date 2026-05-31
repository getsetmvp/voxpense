#!/usr/bin/env node
// Upload prepared OTA bundles to Cloudflare R2 via wrangler.
// Usage: node scripts/upload-to-r2.js <env> <version>

import { execSync } from 'child_process';
import 'dotenv/config';

const [, , env, version] = process.argv;

if (!env || !version) {
  console.error('❌ Usage: node scripts/upload-to-r2.js <env> <version>');
  process.exit(1);
}

const { APP_NAME } = process.env;
if (!APP_NAME) {
  console.error('❌ APP_NAME must be set in env');
  process.exit(1);
}

const basePath = `ota-bundles/${APP_NAME}/${env}/${version}`;
console.log(`🚀 Uploading OTA bundles to R2: ${basePath}`);

execSync(
  `npx wrangler r2 object put ${basePath}/index.android.bundle --file=dist/ota/index.android.bundle --remote`,
  { stdio: 'inherit' },
);

console.log('✅ Bundles uploaded successfully.');
