import { ITEMS, RARITY_ORDER } from "../data/items.js";

// Guesses allowed per round. The single source for the game, the server's
// ranking cut-off, share text and stats; nothing else should hard-code it.
export const MAX_GUESSES = 10;

// ---------------------------------------------------------------------------
// Daily puzzle
// ---------------------------------------------------------------------------
// The daily item is picked on the server with a secret key (server/logic.js),
// so it can't be worked out from this code. The client only numbers the days.

// The puzzle "epoch" — day 0. Used so the puzzle number increments daily.
const EPOCH = new Date(2024, 0, 1);

export function getPuzzleNumber(date = new Date()) {
  const ms = new Date(date.getFullYear(), date.getMonth(), date.getDate()) - EPOCH;
  return Math.floor(ms / 86400000) + 1;
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
    damage: numericResult(guess.damage, target.damage),
    strength: numericResult(guess.strength, target.strength),
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
export const ATTR_ORDER = [
  "rarity",
  "category",
  "damage",
  "strength",
  "source",
  "location",
  "tradeable",
];

// `guesses` is [{ item, result }] — the result is already computed, so this
// works without the client knowing the answer. A column missing from a saved
// result (a game started before that column existed) shows as ⬛.
export function buildShareText(guesses, puzzleNumber, won) {
  const score = won ? guesses.length : "X";
  const header = `SkyblockZordle #${puzzleNumber} ${score}/${MAX_GUESSES}`;
  const cell = (res) => (!res ? "⬛" : res.status === "correct" ? "🟩" : "🟥");
  const rows = guesses.map(({ result: r }) => ATTR_ORDER.map((k) => cell(r[k])).join(""));
  return [header, ...rows, SITE_URL].join("\n");
}
