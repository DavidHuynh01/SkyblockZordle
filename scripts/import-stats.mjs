// Pulls each item's Damage, Strength and rarity from Hypixel's public item API
// into src/data/item-stats.js, matching the ids in src/data/items.js.
//
// Usage:
//   node scripts/import-stats.mjs            (dry run — prints what it found)
//   node scripts/import-stats.mjs --write    (writes src/data/item-stats.js)
//
// Re-run after a Hypixel balance patch. The API is public and needs no key.
// Matching tries: (1) a manual alias, (2) our id upper-cased, which is
// Hypixel's id format, (3) the item's display name. Name matches are listed
// separately so they can be eyeballed: several items share a display name
// with an upgraded "STARRED_" variant or an unrelated item, so once a name
// match is confirmed, pin it in ALIASES.
//
// Dungeon items keep their stats in `tiered_stats` (one value per tier, as the
// item scales). We take the top tier, which is what the wiki shows. Items with
// no Damage or Strength at all (tools, healing wands, reworked fishing rods)
// get 0, which is accurate rather than missing.

import { writeFileSync } from "fs";
import { join, resolve } from "path";
import { fileURLToPath } from "url";
import { BASE_ITEMS } from "../src/data/items.js";

const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const OUT = join(ROOT, "src", "data", "item-stats.js");
const API = "https://api.hypixel.net/v2/resources/skyblock/items";
const WRITE = process.argv.includes("--write");

// Our id -> Hypixel's internal id, where upper-casing ours doesn't line up.
// Every entry here was checked against the API by hand.
const ALIASES = {
  aspect_of_the_dragons: "ASPECT_OF_THE_DRAGON",
  aurora_staff: "RUNIC_STAFF",
  bonemerang: "BONE_BOOMERANG", // not STARRED_BONE_BOOMERANG, the upgraded one
  jerry_chine_gun: "JERRY_STAFF",
  machine_gun_shortbow: "MACHINE_GUN_BOW", // not ARCHER_ULTIMATE_ABILITY, which shares the name
  necrons_blade: "NECRON_BLADE",
  ragnarock: "RAGNAROCK_AXE",
  reaper_falchion: "REAPER_SWORD",
  revenant_falchion: "REVENANT_SWORD",
  rod_of_legends: "LEGEND_ROD",
  savanna_bow: "SAVANA_BOW", // Hypixel's spelling
  soulstealer_bow: "CRYPT_BOW",
  spirit_sceptre: "BAT_WAND", // not STARRED_BAT_WAND, the upgraded one
  stonk: "STONK_PICKAXE",
  treecapitator: "TREECAPITATOR_AXE",
  wither_cloak_sword: "WITHER_CLOAK",
};

// Hypixel's rarity names -> the game's. Hypixel leaves `tier` out for Common.
const RARITY = {
  COMMON: "Common",
  UNCOMMON: "Uncommon",
  RARE: "Rare",
  EPIC: "Epic",
  LEGENDARY: "Legendary",
  MYTHIC: "Mythic",
  DIVINE: "Divine",
  SPECIAL: "Special",
};

// Stats Hypixel's data can't express, set by hand from the in-game item.
const OVERRIDES = {
  // Damage grows with Taming level: 4 per level, up to 240 at Taming 60. The
  // maximum matches how every other scaling item is counted.
  daedalus_axe: { damage: 240 },
};

// A stat's value: flat, or the top tier for dungeon items that scale.
function stat(item, key) {
  if (item.stats?.[key] !== undefined) return item.stats[key];
  const tiers = item.tiered_stats?.[key];
  return Array.isArray(tiers) && tiers.length ? tiers[tiers.length - 1] : 0;
}

const norm = (s) =>
  s.replace(/§./g, "").toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");

const res = await fetch(API);
if (!res.ok) throw new Error(`Hypixel API returned ${res.status}`);
const body = await res.json();
if (!body.success || !Array.isArray(body.items)) throw new Error("unexpected API response");

const byId = new Map(body.items.map((i) => [i.id, i]));
// First non-STARRED item wins a name, so upgraded variants never shadow the base.
const byName = new Map();
for (const i of body.items) {
  const n = norm(i.name);
  if (!byName.has(n) && !i.id.startsWith("STARRED_")) byName.set(n, i);
}

const stats = {};
const byNameMatches = [];
const missing = [];

for (const it of BASE_ITEMS) {
  let h = byId.get(ALIASES[it.id]) || byId.get(it.id.toUpperCase());
  if (!h) {
    h = byName.get(norm(it.name));
    if (h) byNameMatches.push(`${it.name} -> ${h.id}`);
  }
  if (!h) {
    missing.push(it.name);
    continue;
  }
  const rarity = RARITY[h.tier ?? "COMMON"];
  if (!rarity) {
    missing.push(`${it.name} (unknown rarity ${h.tier})`);
    continue;
  }
  stats[it.id] = { damage: stat(h, "DAMAGE"), strength: stat(h, "STRENGTH"), rarity, ...OVERRIDES[it.id] };
}

console.log(`Hypixel data updated ${new Date(body.lastUpdated).toISOString()}`);
console.log(`matched ${Object.keys(stats).length}/${BASE_ITEMS.length}\n`);
for (const it of BASE_ITEMS) {
  const s = stats[it.id];
  if (s) console.log(`  ${it.name.padEnd(26)} dmg ${String(s.damage).padStart(4)}  str ${String(s.strength).padStart(4)}  ${s.rarity}`);
}
if (byNameMatches.length) console.log(`\nmatched by name (check these):\n  ${byNameMatches.join("\n  ")}`);

if (missing.length) {
  console.error(`\nno match for: ${missing.join(", ")} — add them to ALIASES`);
  process.exitCode = 1;
  if (WRITE) console.error("not writing: every item needs stats");
} else if (WRITE) {
  const lines = BASE_ITEMS.map(
    (it) =>
      `  ${JSON.stringify(it.id)}: { damage: ${stats[it.id].damage}, strength: ${stats[it.id].strength}, rarity: ${JSON.stringify(stats[it.id].rarity)} },`
  );
  writeFileSync(
    OUT,
    [
      "// Generated by scripts/import-stats.mjs from Hypixel's public item API.",
      "// Do not edit by hand; re-run the script after a balance patch.",
      `// Hypixel data as of ${new Date(body.lastUpdated).toISOString().slice(0, 10)}.`,
      "",
      "export const ITEM_STATS = {",
      ...lines,
      "};",
      "",
    ].join("\n")
  );
  console.log(`\nwrote ${OUT}`);
} else {
  console.log("\n(dry run — pass --write to save)");
}
