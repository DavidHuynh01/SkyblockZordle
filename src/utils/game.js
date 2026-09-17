import { ITEMS, RARITY_ORDER } from "../data/items.js";

// ---------------------------------------------------------------------------
// Daily puzzle selection
// ---------------------------------------------------------------------------
// Everyone who plays on the same calendar day gets the same target item,
// without any backend. We hash the YYYY-MM-DD string into an index.

export function getDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Simple deterministic string hash (FNV-1a style).
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// The puzzle "epoch" — day 0. Used so the puzzle number increments daily.
const EPOCH = new Date(2024, 0, 1);

export function getPuzzleNumber(date = new Date()) {
  const ms = new Date(date.getFullYear(), date.getMonth(), date.getDate()) - EPOCH;
  return Math.floor(ms / 86400000) + 1;
}

// Deterministic item for a given date-key string (shared by client fallback
// and the server, so both pick the same daily item).
export function getItemForDateKey(dateKey) {
  return ITEMS[hashString(dateKey) % ITEMS.length];
}

export function getDailyItem(date = new Date()) {
  return getItemForDateKey(getDateKey(date));
}

export function getItemById(id) {
  return ITEMS.find((i) => i.id === id);
}

// For "unlimited"/random mode.
export function getRandomItem() {
  return ITEMS[Math.floor(Math.random() * ITEMS.length)];
}

// ---------------------------------------------------------------------------
// Guess comparison
// ---------------------------------------------------------------------------
// Returns a per-attribute result object the UI renders as colored cells.
//   status: "correct" | "wrong"
//   hint:   "up" | "down" | null   (for ordinal/numeric attributes)

export function rarityIndex(rarity) {
  return RARITY_ORDER.indexOf(rarity);
}

function numericResult(guessVal, targetVal) {
  if (guessVal === targetVal) return { status: "correct", hint: null };
  return { status: "wrong", hint: guessVal < targetVal ? "up" : "down" };
}

function matchResult(guessVal, targetVal) {
  return {
    status: guessVal === targetVal ? "correct" : "wrong",
    hint: null,
  };
}

export function compareGuess(guess, target) {
  return {
    rarity: numericResult(rarityIndex(guess.rarity), rarityIndex(target.rarity)),
    category: matchResult(guess.category, target.category),
    npcSell: numericResult(guess.npcSell, target.npcSell),
    source: matchResult(guess.source, target.source),
    location: matchResult(guess.location, target.location),
    tradeable: matchResult(guess.tradeable, target.tradeable),
  };
}

export function isWin(guess, target) {
  return guess.id === target.id;
}

// Where shared results point people. Set VITE_SITE_URL to your real domain once
// you have one; otherwise it falls back to the repo. Note: this module is also
// imported by the Node server, where `import.meta.env` doesn't exist — hence the
// optional chaining.
const SITE_URL =
  import.meta.env?.VITE_SITE_URL || "https://github.com/DavidHuynh01/skyblockzordle";

// Wordle-style spoiler-free emoji grid for sharing a daily result.
const ATTR_ORDER = ["rarity", "category", "npcSell", "source", "location", "tradeable"];

// `guesses` is [{ item, result }] — the result is already computed, so this
// works without the client knowing the answer.
export function buildShareText(guesses, puzzleNumber, won) {
  const score = won ? guesses.length : "X";
  const header = `SkyblockZordle #${puzzleNumber} ${score}/8`;
  const rows = guesses.map(({ result: r }) =>
    ATTR_ORDER.map((k) => (r[k].status === "correct" ? "🟩" : "🟥")).join("")
  );
  return [header, ...rows, SITE_URL].join("\n");
}
