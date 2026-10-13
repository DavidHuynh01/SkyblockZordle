// Server-side game logic. Reuses the SAME item data and comparison logic as
// the frontend (single source of truth) via the shared src/ modules.
import { createHmac } from "crypto";
import { ITEMS } from "../src/data/items.js";
import { compareGuess, getItemById } from "../src/utils/game.js";

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

// The daily pick is keyed by a server-only secret. The code is public, so a
// pick from the date alone would let anyone compute any day's answer and post
// a one-guess solve. Without a secret (local dev, tests) a fixed key is used;
// config.js logs an error if production ever runs that way.
const DEV_DAILY_SECRET = "dev-only-not-secret";

export function answerFor(dateKey, secret) {
  const mac = createHmac("sha256", secret || DEV_DAILY_SECRET).update(dateKey).digest();
  return ITEMS[mac.readUInt32BE(0) % ITEMS.length];
}

export { compareGuess, getItemById as itemById, ITEMS };
