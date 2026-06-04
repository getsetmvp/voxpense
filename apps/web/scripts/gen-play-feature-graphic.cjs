#!/usr/bin/env node
/**
 * Generate the 1024×500 Play Store feature graphic.
 *
 * Run from anywhere (requires resvg-js installed in apps/web):
 *   node apps/web/scripts/gen-play-feature-graphic.cjs
 *
 * Output:
 *   ~/Productivity/hustle/voxpense/play-assets/feature-graphic-1024x500.png
 *
 * Edit the SVG below to iterate. Re-run to overwrite.
 */
const { Resvg } = require('@resvg/resvg-js');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="500" viewBox="0 0 1024 500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1024" y2="500" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#4338CA"/>
      <stop offset="55%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#A78BFA"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.7" cy="0.3" r="0.7">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.18"/>
      <stop offset="60%" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="500" fill="url(#bg)"/>
  <rect width="1024" height="500" fill="url(#glow)"/>
  <g stroke="#FFFFFF" stroke-opacity="0.06" stroke-width="1">
    ${Array.from({ length: 16 })
      .map((_, i) => `<line x1="${i * 64}" y1="0" x2="${i * 64}" y2="500"/>`)
      .join('')}
    ${Array.from({ length: 8 })
      .map((_, i) => `<line x1="0" y1="${i * 64}" x2="1024" y2="${i * 64}"/>`)
      .join('')}
  </g>
  <g fill="#FFFFFF" fill-opacity="0.7">
    <circle cx="900" cy="80" r="3"/>
    <circle cx="940" cy="120" r="2"/>
    <circle cx="970" cy="60" r="4"/>
    <circle cx="850" cy="100" r="2"/>
    <path d="M920 200 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 z" fill-opacity="0.85"/>
  </g>
  <g transform="translate(80, 170)">
    <rect width="160" height="160" rx="32" fill="#FFFFFF"/>
    <g transform="translate(80, 80)">
      <rect x="-18" y="-44" width="36" height="56" rx="18" fill="#6366F1"/>
      <path d="M-28 8 v6 a28 28 0 0 0 56 0 v-6" fill="none" stroke="#6366F1" stroke-width="6" stroke-linecap="round"/>
      <line x1="0" y1="36" x2="0" y2="50" stroke="#6366F1" stroke-width="6" stroke-linecap="round"/>
      <line x1="-12" y1="50" x2="12" y2="50" stroke="#6366F1" stroke-width="6" stroke-linecap="round"/>
    </g>
  </g>
  <g transform="translate(280, 215)" fill="#FFFFFF" font-family="Helvetica, Arial, sans-serif">
    <text x="0" y="0" font-weight="700" font-size="78" letter-spacing="-2">VoxPense</text>
    <text x="0" y="60" fill-opacity="0.92" font-weight="500" font-size="34">Speak it. We log it.</text>
    <text x="0" y="105" fill-opacity="0.7" font-weight="400" font-size="20">Voice-first expense tracking with AI</text>
  </g>
  <g transform="translate(720, 380)">
    <rect width="220" height="48" rx="24" fill="#FFFFFF" fill-opacity="0.18"/>
    <text x="110" y="32" text-anchor="middle" fill="#FFFFFF" font-family="Helvetica, Arial, sans-serif" font-weight="600" font-size="18">Free · Private · India-hosted</text>
  </g>
</svg>`;

const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1024 },
  font: { loadSystemFonts: true, defaultFontFamily: 'Helvetica' },
});

const png = resvg.render().asPng();
const out = path.join(
  os.homedir(),
  'Productivity/hustle/voxpense/play-assets/feature-graphic-1024x500.png',
);
fs.writeFileSync(out, png);
console.log(`Wrote ${out} (${png.length} bytes, 1024×500)`);
