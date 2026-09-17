import express from "express";
import cors from "cors";
import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import {
  utcDateKey,
  puzzleNumber,
  answerFor,
  compareGuess,
  itemById,
} from "./logic.js";
import * as store from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

const HERE = dirname(fileURLToPath(import.meta.url));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Today's puzzle metadata. The answer is intentionally NOT included, so it is
// never sitting in the client bundle or a network response.
app.get("/api/daily", (_req, res) => {
  const date = utcDateKey();
  res.json({ date, puzzleNumber: puzzleNumber(date) });
});

// Check a single guess server-side. Returns per-attribute comparison + whether
// it's correct. Reveals the answer object only on a correct guess.
app.post("/api/guess", (req, res) => {
  const { date, itemId } = req.body || {};
  const day = date || utcDateKey();
  const guess = itemById(itemId);
  if (!guess) return res.status(400).json({ error: "unknown item" });
  const answer = answerFor(day);
  const correct = guess.id === answer.id;
  res.json({
    result: compareGuess(guess, answer),
    correct,
    answer: correct ? answer : undefined,
  });
});

// Reveal the answer (used by the client after a loss / give-up).
app.get("/api/reveal", (req, res) => {
  const day = req.query.date || utcDateKey();
  res.json({ answer: answerFor(day) });
});

// Submit a finished daily result to the leaderboard.
app.post("/api/score", (req, res) => {
  const { name, date, guesses, won, timeMs, clientId } = req.body || {};
  const day = date || utcDateKey();
  const cleanName =
    (name || "Anonymous").toString().trim().slice(0, 16).replace(/[^\w \-]/g, "") ||
    "Anonymous";
  if (typeof guesses !== "number" || guesses < 1 || guesses > 8) {
    return res.status(400).json({ error: "bad guesses" });
  }
  store.addScore({
    name: cleanName,
    date: day,
    puzzleNumber: puzzleNumber(day),
    guesses,
    won: !!won,
    timeMs: Number(timeMs) || 0,
    clientId: (clientId || "anon").toString().slice(0, 64),
    createdAt: Date.now(),
  });
  res.json({ ok: true });
});

app.get("/api/leaderboard", (req, res) => {
  const day = req.query.date || utcDateKey();
  res.json({ date: day, entries: store.leaderboard(day) });
});

app.get("/api/stats", (_req, res) => {
  res.json(store.globalStats(utcDateKey()));
});

// If a production build exists, serve it from the same origin (single-service
// deploy — no CORS needed). API routes above take precedence.
const dist = join(HERE, "..", "dist");
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*", (_req, res) => res.sendFile(join(dist, "index.html")));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`SkyblockZordle API listening on :${PORT}`));
