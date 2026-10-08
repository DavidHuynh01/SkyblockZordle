// Transport-agnostic API. Both the local Express server and the AWS Lambda
// handler call handleRequest(), so the two deployments can't drift apart.
import { utcDateKey, puzzleNumber, answerFor, compareGuess, itemById } from "./logic.js";

const reply = (status, body) => ({ status, body });

export function createApi(store) {
  return {
    health: async () => reply(200, { ok: true }),

    daily: async () => {
      const date = utcDateKey();
      return reply(200, { date, puzzleNumber: puzzleNumber(date) });
    },

    // The answer is only returned on a correct guess, so it never leaks.
    guess: async ({ date, itemId } = {}) => {
      const day = date || utcDateKey();
      const guess = itemById(itemId);
      if (!guess) return reply(400, { error: "unknown item" });
      const answer = answerFor(day);
      const correct = guess.id === answer.id;
      return reply(200, {
        result: compareGuess(guess, answer),
        correct,
        answer: correct ? answer : undefined,
      });
    },

    reveal: async ({ date } = {}) => reply(200, { answer: answerFor(date || utcDateKey()) }),

    score: async (body = {}) => {
      const { name, date, guesses, won, timeMs, clientId } = body;
      const day = date || utcDateKey();
      if (typeof guesses !== "number" || guesses < 1 || guesses > 8) {
        return reply(400, { error: "bad guesses" });
      }
      const cleanName =
        (name || "Anonymous").toString().trim().slice(0, 16).replace(/[^\w \-]/g, "") ||
        "Anonymous";
      await store.addScore({
        name: cleanName,
        date: day,
        puzzleNumber: puzzleNumber(day),
        guesses,
        won: !!won,
        timeMs: Number(timeMs) || 0,
        clientId: (clientId || "anon").toString().slice(0, 64),
        createdAt: Date.now(),
      });
      return reply(200, { ok: true });
    },

    leaderboard: async ({ date } = {}) => {
      const day = date || utcDateKey();
      return reply(200, { date: day, entries: await store.leaderboard(day) });
    },

    stats: async () => reply(200, await store.globalStats(utcDateKey())),
  };
}

export async function handleRequest(api, { method, path, query = {}, body = {} }) {
  const i = path.indexOf("/api/");
  const route = i >= 0 ? path.slice(i) : path;
  const m = (method || "GET").toUpperCase();

  if (m === "OPTIONS") return reply(204, null);
  if (m === "GET" && route === "/api/health") return api.health();
  if (m === "GET" && route === "/api/daily") return api.daily();
  if (m === "POST" && route === "/api/guess") return api.guess(body);
  if (m === "GET" && route === "/api/reveal") return api.reveal(query);
  if (m === "POST" && route === "/api/score") return api.score(body);
  if (m === "GET" && route === "/api/leaderboard") return api.leaderboard(query);
  if (m === "GET" && route === "/api/stats") return api.stats();
  return reply(404, { error: "not found" });
}
