// FONTS-1: regenerate the Material Symbols subset (keep-axes) from the icon
// names actually used in src/. Run from frontend/:
//   node scripts/gen-msymbol-subset.mjs          # scan + fetch + write
//   node scripts/gen-msymbol-subset.mjs --check  # exit 1 if names drifted
// Names must appear as scannable literals (see MSymbol.tsx docstring) —
// never build icon names from template strings or DB values.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const TXT = join(ROOT, "scripts", "msymbol-icon-names.txt");
const OUT = join(ROOT, "public", "fonts", "material-symbols-outlined-subset.woff2");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const names = new Set();
const walk = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(tsx|ts)$/.test(e.name)) {
      const s = readFileSync(p, "utf8");
      for (const m of s.matchAll(/MSymbol\s+name="([a-z0-9_]+)"/g)) names.add(m[1]);
      for (const m of s.matchAll(/icon(?::\s*|=\{?)"([a-z0-9_]+)"/g)) names.add(m[1]);
      for (const m of s.matchAll(/name=\{([^}]*)\}/g))
        for (const q of m[1].matchAll(/"([a-z0-9_]+)"/g)) names.add(q[1]);
    }
  }
};
walk(SRC);
const sorted = [...names].sort();
console.log(`${sorted.length} icon names:`, sorted.join(", "));

if (process.argv.includes("--check")) {
  const committed = readFileSync(TXT, "utf8").trim().split("\n");
  const drift = sorted.join("\n") !== committed.join("\n");
  if (drift) { console.error("DRIFT: rerun gen-msymbol-subset.mjs and commit"); process.exit(1); }
  console.log("no drift"); process.exit(0);
}

writeFileSync(TXT, sorted.join("\n") + "\n");
const cssURL = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=" + sorted.join(",") + "&display=block";
const css = await (await fetch(cssURL, { headers: { "User-Agent": UA } })).text();
const woffURL = css.match(/url\((https:[^)]+)\) format\('woff2'\)/)?.[1];
if (!woffURL) { console.error("no woff2 URL in css2 response:\n" + css); process.exit(1); }
const buf = Buffer.from(await (await fetch(woffURL, { headers: { "User-Agent": UA } })).arrayBuffer());
writeFileSync(OUT, buf);
console.log(`wrote ${OUT} (${buf.length} bytes)`);
if (buf.length > 150_000) { console.error("subset unexpectedly large (>150KB) — investigate before committing"); process.exit(1); }
