// Server-side game logic. Reuses the SAME item data and comparison logic as
// the frontend (single source of truth) via the shared src/ modules.
import { ITEMS } from "../src/data/items.js";
import { compareGuess, getItemForDateKey, getItemById } from "../src/utils/game.js";

// Daily boundary uses UTC so every player worldwide gets the same item on the
// same calendar day regardless of the server's timezone.
export function utcDateKey(d = new Date()) {
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

const EPOCH = Date.UTC(2024, 0, 1);

export function puzzleNumber(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return Math.floor((Date.UTC(y, m - 1, d) - EPOCH) / 86400000) + 1;
}

export function answerFor(dateKey) {
  return getItemForDateKey(dateKey);
}

export { compareGuess, getItemById as itemById, ITEMS };
