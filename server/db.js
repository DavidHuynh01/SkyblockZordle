// Tiny JSON-file datastore for leaderboard scores. No native dependencies —
// reads once into memory, writes synchronously on change. Fine for a small
// game; swap for a real DB (Postgres/SQLite) if it ever gets big.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "data");
const FILE = join(DIR, "leaderboard.json");

function load() {
  try {
    return JSON.parse(readFileSync(FILE, "utf8"));
  } catch {
    return { scores: [] };
  }
}

let db = load();

function save() {
  if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify(db));
}

// One score per (clientId, date): a new submission replaces the old one, so a
// player updating their display name doesn't create duplicate rows.
export function addScore(entry) {
  db.scores = db.scores.filter(
    (s) => !(s.clientId === entry.clientId && s.date === entry.date)
  );
  db.scores.push(entry);
  save();
}

export function leaderboard(dateKey, limit = 50) {
  return db.scores
    .filter((s) => s.date === dateKey && s.won)
    .sort(
      (a, b) =>
        a.guesses - b.guesses ||
        (a.timeMs || 0) - (b.timeMs || 0) ||
        a.createdAt - b.createdAt
    )
    .slice(0, limit)
    .map((s, i) => ({
      rank: i + 1,
      name: s.name,
      guesses: s.guesses,
      timeMs: s.timeMs || 0,
    }));
}

export function globalStats(dateKey) {
  const all = db.scores;
  const wins = all.filter((s) => s.won);
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 };
  wins.forEach((s) => {
    if (dist[s.guesses] != null) dist[s.guesses]++;
  });
  return {
    played: all.length,
    wins: wins.length,
    winPercent: all.length ? Math.round((wins.length / all.length) * 100) : 0,
    dist,
    todayPlayers: all.filter((s) => s.date === dateKey).length,
    todaySolved: all.filter((s) => s.date === dateKey && s.won).length,
  };
}
