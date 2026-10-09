// JSON-file store used for local development. One score per (clientId, date).
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
const FILE = join(DIR, "leaderboard.json");

function load() {
  try {
    return JSON.parse(readFileSync(FILE, "utf8"));
  } catch {
    return { scores: [], users: {}, games: {} };
  }
}

export function createJsonStore() {
  const db = load();
  db.users = db.users || {};
  db.games = db.games || {};
  const save = () => {
    if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
    writeFileSync(FILE, JSON.stringify(db));
  };

  return {
    async upsertUser(user) {
      db.users[user.id] = { ...user, lastLogin: Date.now() };
      save();
    },

    async recordGuess({ date, userId, now = Date.now() }) {
      const k = `${date}|${userId}`;
      const g = db.games[k] || { guesses: 0, startedAt: now, solved: false };
      g.guesses += 1;
      db.games[k] = g;
      save();
      return { guesses: g.guesses, startedAt: g.startedAt, solved: !!g.solved };
    },

    async markSolved({ date, userId, now = Date.now() }) {
      const k = `${date}|${userId}`;
      db.games[k] = { ...(db.games[k] || { guesses: 1, startedAt: now }), solved: true, solvedAt: now };
      save();
    },

    async addScore(entry) {
      db.scores = db.scores.filter(
        (s) => !(s.userId === entry.userId && s.date === entry.date)
      );
      db.scores.push(entry);
      save();
    },

    async leaderboard(dateKey, limit = 50) {
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
          avatar: s.avatar || null,
          guesses: s.guesses,
          timeMs: s.timeMs || 0,
        }));
    },

    async globalStats(dateKey) {
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
    },
  };
}
