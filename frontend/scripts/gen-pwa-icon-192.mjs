#!/usr/bin/env node
/**
 * PWA icon generator — resize icon-512.png → icon-192.png.
 *
 * One-shot: run after replacing/updating icon-512.png. Outputs
 * icon-192.png (high-quality Lanczos resize via sharp). The result is
 * committed to public/ — this script is for regeneration only, not part
 * of the build.
 *
 * Usage (from frontend/):
 *   npx --yes sharp-cli resize 192 192 public/icon-512.png public/icon-192.png
 *
 * Or programmatically (this script):
 *   node scripts/gen-pwa-icon-192.mjs
 *
 * sharp is NOT a project dependency — install it ad-hoc if regenerating:
 *   npm install --no-save sharp && node scripts/gen-pwa-icon-192.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, "..", "public");
const src = join(pub, "icon-512.png");
const dst = join(pub, "icon-192.png");

try {
  const sharp = (await import("sharp")).default;
  await sharp(await readFile(src))
    .resize(192, 192, { fit: "cover", kernel: "lanczos3" })
    .png()
    .toFile(dst);
  console.log(`✓ wrote ${dst} (192×192, Lanczos3 from icon-512.png)`);
} catch (e) {
  if (e.code === "ERR_MODULE_NOT_FOUND" || /Cannot find package 'sharp'/.test(e.message)) {
    console.error("sharp not installed. Install ad-hoc then re-run:");
    console.error("  cd frontend && npm install --no-save sharp && node scripts/gen-pwa-icon-192.mjs");
    process.exit(2);
  }
  throw e;
}
