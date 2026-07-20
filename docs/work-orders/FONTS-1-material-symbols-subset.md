# WO-FONTS-1: Material Symbols subset — keep-axes, icon_names server-side
Status: open
Lane/files: `frontend/scripts/gen-msymbol-subset.mjs` (new), `frontend/scripts/msymbol-icon-names.txt` (generated, committed), `frontend/public/fonts/material-symbols-outlined-subset.woff2` (new), `frontend/public/fonts/material-symbols-outlined.woff2` (**delete**), `frontend/src/index.css` (1 บรรทัด src), `frontend/src/components/ui/MSymbol.tsx` (docstring note เท่านั้น)
Branch: main
Model tier: **cheap-ok** (สูตร verbatim ครบ — GLM execute ได้; ถ้า network ถึง fonts.googleapis.com ไม่ได้ → ยกให้ Sonnet/Fable5 รันเฉพาะ Step 2 แล้วทำต่อตามเดิม)

## บริบท

F6 self-host Material Symbols แบบ**ไฟล์เต็ม 3.9MB** พร้อมเหตุผล "subset ของ
variable font ทำให้ axes หาย" (a04df47). Fable5 review #5 flag เป็น nit:
เน็ตช้า icon จะ blank นาน (`font-display: block` ทำให้ช่องว่างค้างจนกว่าฟอนต์มา).

**ข้ออ้าง "axes หาย" ตกไปแล้ว — Fable5 validate สูตรนี้จริง 2026-07-20**:
Google Fonts css2 API รองรับ `icon_names=` (server-side subset) และคืน
**variable font ที่ axes ครบ**. Probe จริง: 3 icons → **4,648 bytes**, fvar =
`FILL 0..1, GRAD -50..200, opsz 20..48, wght 100..700` ครบทั้ง 4 แกน.
(pyftsubset ทำเองไม่ได้ผล: GSUB closure เห็น a-z+_ ครบจะลาก ligature ทุกตัว
กลับมา = ไฟล์ไม่เล็กลง — อย่าเสียเวลาเส้นนั้น)

แอปใช้จริง: `.msym` ตั้ง `FILL 0/1, wght 400` (index.css:170-172) — เก็บ
range เต็มตาม canonical request (อนาคต Track F ปรับ GRAD/opsz ได้ฟรี).

## Steps (verbatim)

### 1. สร้าง `frontend/scripts/gen-msymbol-subset.mjs` (ไฟล์ใหม่ ทั้งไฟล์):

```js
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
```

### 2. รัน (จาก `frontend/`):

```
node scripts/gen-msymbol-subset.mjs
```

คาดผล: ~48 names (นับจาก scan 2026-07-20: add, apartment, arrow_forward,
attach_file, bolt, build, calendar_month, cancel, check_circle, close, co2,
dashboard, database, delete, description, download, edit, edit_note, error,
gavel, health_and_safety, history, info, insights, key, local_gas_station,
login, logout, mail, medical_services, monitoring, notifications, park,
picture_as_pdf, print, recycling, refresh, restaurant, save, schedule,
science, smart_toy, trending_down, trending_up, upload_file, warning,
water_drop, water_full) + ไฟล์ subset ~20-80KB. ถ้า scan ได้จำนวน**น้อยกว่า**
รายการนี้ = regex พลาด — หยุดแล้ว checkpoint.

### 3. `frontend/src/index.css` — แก้ 1 บรรทัดใน block เดิม (บรรทัด ~46):

```diff
-  src: url("/fonts/material-symbols-outlined.woff2") format("woff2");
+  src: url("/fonts/material-symbols-outlined-subset.woff2") format("woff2");
```

(คง `font-weight: 100 700` + `font-display: block` เดิมทุกบรรทัด — ชื่อไฟล์ใหม่
= cache-bust ในตัว. หมายเหตุ: Vite rebase `/fonts/...` ตาม base อัตโนมัติ —
พิสูจน์แล้วใน review #5.)

### 4. ลบไฟล์เต็ม:

```
git rm frontend/public/fonts/material-symbols-outlined.woff2
```

### 5. เพิ่ม 2 บรรทัดใน docstring ของ `MSymbol.tsx` (component comment, ไม่แตะ logic/className):

```
 * FONTS-1: the font file is a subset generated from the literal icon names
 * in src/ — after adding a new name, rerun `node scripts/gen-msymbol-subset.mjs`.
```

## Verify commands (ทุกข้อต้องผ่านก่อน push)

1. `node scripts/gen-msymbol-subset.mjs --check` → "no drift"
2. Axes ครบ (รันจาก repo root):
   `uv run --with fonttools --with brotli python -c "from fontTools.ttLib import TTFont; f=TTFont('frontend/public/fonts/material-symbols-outlined-subset.woff2'); print([(a.axisTag,a.minValue,a.maxValue) for a in f['fvar'].axes])"`
   → ต้องเห็นทั้ง `FILL(0,1) GRAD(-50,200) opsz(20,48) wght(100,700)`
3. ขนาด: subset < 150KB (เทียบเดิม 3,899KB = **−3.75MB+**)
4. `npm run build` ✅ + `npx playwright test` 23/23 ✅
5. Visual (Track F check — บันทึกผลใน Checkpoint): dev server → เปิด `/` และ
   `/dashboard` → sidebar icons render เป็น glyph ไม่ใช่ข้อความดิบ/tofu +
   DevTools Network ไม่มี request ไป fonts.gstatic.com/googleapis.com +
   console: `document.fonts.check('400 22px "Material Symbols Outlined"')` = true
6. grep กัน regression: `grep -r "material-symbols-outlined.woff2" frontend/src frontend/index.html` → 0 hits (เหลือแต่ `-subset`)

## Forbidden

- ห้ามแตะ `.msym` / `.msym--fill` / className ใด ๆ (Track F styling เดิม)
- ห้ามแก้ font-family อื่น (Jakarta / Plex Thai / JetBrains — F8 จัดแล้ว)
- ห้าม pyftsubset local (closure ดึง ligature ทั้ง font — เหตุผลด้านบน)
- ห้าม commit ถ้า Verify ข้อใดแดง — checkpoint แล้วแจ้งแทน

## Reference pattern

- F6 `a04df47` (self-host @font-face block) + F8 `da1fa03` (fonts dedupe)
- Probe validation รอบนี้: `docs/handoff/2026-07-19-track-z-complete.md`
  §Fable5 review #7 (3-icon subset = 4,648B, axes ครบ — คำสั่งเดียวกับ Verify #2)
- Material Symbols = Apache 2.0 — self-host subset ได้, ไม่ต้อง attribution ใน UI

## Checkpoint log

- [2026-07-20] fable5: เขียน WO + validate สูตร css2 icon_names จริง (axes ครบ,
  4.6KB/3 icons) + inventory 48 names จาก scan `name="…"` / `icon: "…"` /
  `name={…"…"…}` ทั้ง frontend/src. พร้อม dispatch GLM.
