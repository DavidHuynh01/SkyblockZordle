// Imports item textures from an extracted resource pack (e.g. FurfSky Reborn)
// into public/items/<id>.png, matching the ids in src/data/items.js.
//
// Usage:
//   node scripts/import-textures.mjs            (dry run — reports matches only)
//   node scripts/import-textures.mjs --write    (actually copies the PNGs)
//
// It scans the pack's CIT folders, indexes every PNG by its basename, and for
// each game item tries: (1) exact id match, (2) slug-of-name match,
// (3) a normalized loose match. Prefers the "canonical" icon whose parent
// folder name equals the file name.

import { readdirSync, statSync, mkdirSync, copyFileSync, existsSync } from "fs";
import { join, basename, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { ITEMS } from "../src/data/items.js";

const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
// Pack root defaults to the bundled assets/ folder; override with PACK_DIR to
// point at any extracted resource pack's "assets" directory.
const PACK_ROOT = process.env.PACK_DIR || join(ROOT, "assets");
// Common item-texture locations across packs (scanned if present):
const SCAN_DIRS = [
  join(PACK_ROOT, "hypixel_skyblock", "textures", "item"), // Hypixel official
  join(PACK_ROOT, "minecraft", "mcpatcher", "cit"), // FurfSky (OptiFine CIT)
  join(PACK_ROOT, "minecraft", "textures", "item"), // vanilla (new layout)
  join(PACK_ROOT, "minecraft", "textures", "items"), // vanilla (old layout)
];
const OUT_DIR = join(ROOT, "public", "items");
const WRITE = process.argv.includes("--write");

// Item ids whose pack filename differs from our id (Hypixel naming).
const ALIASES = {
  aspect_of_the_dragons: "aspect_of_the_dragon",
  mosquito_bow: "mosquito_shortbow",
  daedalus_axe: "daedalus_blade",
};

// --- recursively collect all .png paths ---
function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (entry.toLowerCase().endsWith(".png")) out.push(p);
  }
  return out;
}

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const pngs = [];
for (const dir of SCAN_DIRS) {
  if (existsSync(dir)) walk(dir, pngs);
}
if (pngs.length === 0) {
  console.error(`No PNGs found. Looked in:\n  ${SCAN_DIRS.join("\n  ")}`);
  process.exit(1);
}
console.log(`Scanned ${pngs.length} PNGs in pack.\n`);

// Build lookup indexes. For each base name keep the "best" path: one whose
// parent folder matches the file name scores highest, then shortest path.
const byBase = new Map(); // base -> path
const byNorm = new Map(); // normalized base -> path
function score(p) {
  const base = basename(p, ".png");
  const parent = basename(dirname(p));
  let s = 0;
  if (parent === base) s += 100; // canonical icon folder
  s -= p.length / 1000; // prefer shorter paths
  if (/\b(big|small|left|right|back|gui|tab|animation|frame)\b/i.test(p)) s -= 50;
  return s;
}
for (const p of pngs) {
  const base = basename(p, ".png").toLowerCase();
  const n = norm(base);
  if (!byBase.has(base) || score(p) > score(byBase.get(base))) byBase.set(base, p);
  if (!byNorm.has(n) || score(p) > score(byNorm.get(n))) byNorm.set(n, p);
}

const slug = (name) =>
  name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

const matched = [];
const missed = [];

for (const item of ITEMS) {
  const candidates = [ALIASES[item.id], item.id, slug(item.name)].filter(Boolean);
  let hit = null;
  let how = "";
  for (const c of candidates) {
    if (byBase.has(c)) { hit = byBase.get(c); how = `exact:${c}`; break; }
  }
  if (!hit) {
    for (const c of candidates) {
      const n = norm(c);
      if (byNorm.has(n)) { hit = byNorm.get(n); how = `loose:${c}`; break; }
    }
  }
  if (hit) matched.push({ item, hit, how });
  else missed.push(item);
}

console.log(`MATCHED ${matched.length}/${ITEMS.length}:`);
for (const m of matched) {
  console.log(`  ✓ ${m.item.id.padEnd(30)} <- ${m.hit.split("cit")[1]}`);
}
console.log(`\nMISSED ${missed.length}:`);
for (const m of missed) console.log(`  ✗ ${m.id}  ("${m.name}")`);

if (WRITE) {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const m of matched) copyFileSync(m.hit, join(OUT_DIR, `${m.item.id}.png`));
  console.log(`\nWrote ${matched.length} PNGs to public/items/`);
} else {
  console.log(`\n(dry run — re-run with --write to copy these into public/items/)`);
}
