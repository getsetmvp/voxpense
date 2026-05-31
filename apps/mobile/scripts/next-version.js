#!/usr/bin/env node
// Fetch ota-server /version endpoint, return highest+1 (or 1 for first publish).
// Usage: node scripts/next-version.js <env>

import 'dotenv/config';

const [, , env] = process.argv;
if (!env) {
  console.error('❌ Usage: node scripts/next-version.js <env>');
  process.exit(1);
}

const { APP_NAME, OTA_SERVER_URL } = process.env;
if (!APP_NAME || !OTA_SERVER_URL) {
  console.error('❌ APP_NAME and OTA_SERVER_URL must be set in env');
  process.exit(1);
}

async function main() {
  const res = await fetch(`${OTA_SERVER_URL}/version`);
  if (!res.ok) {
    console.error(`❌ Failed to fetch version info: ${res.status}`);
    process.exit(1);
  }
  const data = await res.json();
  const project = data[APP_NAME];
  if (!project || !project[env]) {
    console.log(1);
    return;
  }
  const highest = parseInt(project[env].highest || '0', 10);
  console.log(highest + 1);
}

main();
