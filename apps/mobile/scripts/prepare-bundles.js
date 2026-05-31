#!/usr/bin/env node
// Find Expo's hashed bundle files + rename for OTA upload.
// Run after `expo export --experimental-bundle`.

import fs from 'fs';
import path from 'path';

const DIST_DIR = 'dist/_expo/static/js';
const OUT_DIR = 'dist/ota';

function findBundle(platform) {
  const dir = path.join(DIST_DIR, platform);
  if (!fs.existsSync(dir)) {
    console.error(`❌ Directory not found: ${dir}`);
    process.exit(1);
  }
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.hbc'));
  if (files.length === 0) {
    console.error(`❌ No .hbc bundle found for ${platform}`);
    process.exit(1);
  }
  return path.join(dir, files[0]);
}

function prepare() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const androidSrc = findBundle('android');
  const androidDest = path.join(OUT_DIR, 'index.android.bundle');
  fs.copyFileSync(androidSrc, androidDest);
  console.log(`✅ Android bundle prepared: ${androidDest}`);
  // iOS deferred — pattern ready when iOS ships per design open Q
  // const iosSrc = findBundle('ios');
  // fs.copyFileSync(iosSrc, path.join(OUT_DIR, 'index.ios.bundle'));
}

prepare();
