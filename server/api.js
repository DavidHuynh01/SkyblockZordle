// Transport-agnostic API. Both the local Express server and the AWS Lambda
// handler call handleRequest(), so the two deployments can't drift apart.
import { utcDateKey, puzzleNumber, answerFor, compareGuess, itemById } from "./logic.js";
import { createSessionToken, verifySessionToken, createState, verifyState, bearerFrom } from "./auth.js";
import { authorizeUrl, exchangeCode, fetchUser } from "./discord.js";
import { createRateLimiter } from "./ratelimit.js";

const MAX_GUESSES = 8;
const reply = (status, body, headers) => ({ status, body, headers });
const redirect = (location) => ({ status: 302, body: null, headers: { location } });

/**
 * config: { sessionSecret, discordClientId, discordClientSecret, redirectUri, siteUrl }
 * Auth routes are only enabled when the Discord credentials are present, so the
 * game still runs (anonymously) without them.
 */
export function createApi(store, config = {}, deps = {}) {
  const fetchImpl = deps.fetchImpl || fetch;
  const authEnabled = Boolean(config.discordClientId && config.discordClientSecret && config.sessionSecret);
  const userFrom = (headers) =>
    authEnabled ? verifySessionToken(bearerFrom(headers), config.sessionSecret) : null;

  return {
    authEnabled,

    health: async () => reply(200, { ok: true, auth: authEnabled }),

    daily: async () => {
      const date = utcDateKey();
      return reply(200, { date, puzzleNumber: puzzleNumber(date) });
    },

    me: async (_q, headers) => {
      const user = userFrom(headers);
      return user ? reply(200, { user }) : reply(401, { error: "not signed in" });
    },

    login: async () => {
      if (!authEnabled) return reply(503, { error: "discord login not configured" });
      return redirect(
        authorizeUrl({
          clientId: config.discordClientId,
          redirectUri: config.redirectUri,
          state: createState(config.sessionSecret),
        })
      );
    },

    callback: async (query = {}) => {
      if (!authEnabled) return reply(503, { error: "discord login not configured" });
      const { code, state } = query;
      if (!code || !verifyState(state, config.sessionSecret)) {
        return redirect(`${config.siteUrl}/#login=failed`);
      }
      try {
        const accessToken = await exchangeCode(
          {
            code,
            clientId: config.discordClientId,
            clientSecret: config.discordClientSecret,
            redirectUri: config.redirectUri,
          },
          fetchImpl
        );
        const user = await fetchUser(accessToken, fetchImpl);
        await store.upsertUser(user);
        const token = createSessionToken(user, config.sessionSecret);
        return redirect(`${config.siteUrl}/#token=${encodeURIComponent(token)}`);
      } catch (err) {
        console.error("discord login failed:", err.message);
        return redirect(`${config.siteUrl}/#login=failed`);
      }
    },

    // Signed-in players have their guesses counted server-side, and a solve is
    // recorded straight to the leaderboard — the client never reports a score.
    guess: async (body = {}, headers = {}) => {
      const day = body.date || utcDateKey();
      const guess = itemById(body.itemId);
      if (!guess) return reply(400, { error: "unknown item" });

      const answer = answerFor(day);
      const correct = guess.id === answer.id;
      const user = userFrom(headers);
      let recorded = null;

      if (user) {
        const state = await store.recordGuess({ date: day, userId: user.id });
        recorded = { guesses: state.guesses, alreadySolved: state.solved };
        if (correct && !state.solved && state.guesses <= MAX_GUESSES) {
          const timeMs = Math.max(0, Date.now() - state.startedAt);
          await store.markSolved({ date: day, userId: user.id });
          await store.addScore({
            userId: user.id,
            name: user.username,
            avatar: user.avatar || null,
            date: day,
            puzzleNumber: puzzleNumber(day),
            guesses: state.guesses,
            won: true,
            timeMs,
            createdAt: Date.now(),
          });
        }
      }

      return reply(200, {
        result: compareGuess(guess, answer),
        correct,
        answer: correct ? answer : undefined,
        ...(recorded ? { serverGuesses: recorded.guesses } : {}),
      });
    },

    reveal: async ({ date } = {}) => reply(200, { answer: answerFor(date || utcDateKey()) }),

    leaderboard: async ({ date } = {}) => {
      const day = date || utcDateKey();
      return reply(200, { date: day, entries: await store.leaderboard(day) });
    },

    stats: async () => reply(200, await store.globalStats(utcDateKey())),
  };
}

const limiter = createRateLimiter();

// Writes (guessing) cost a DynamoDB write; reads are cheap. Auth routes count
// as writes so nobody can spin the OAuth flow in a loop.
const WRITE_ROUTES = new Set(["/api/guess", "/api/auth/login", "/api/auth/callback"]);

export async function handleRequest(api, { method, path, query = {}, body = {}, headers = {}, ip } = {}) {
  const i = path.indexOf("/api/");
  const route = i >= 0 ? path.slice(i) : path;
  const m = (method || "GET").toUpperCase();

  if (m === "OPTIONS") return reply(204, null);

  const { allowed, retryAfter } = limiter.check(ip, WRITE_ROUTES.has(route) ? "write" : "read");
  if (!allowed) {
    return reply(429, { error: "too many requests" }, { "retry-after": String(retryAfter) });
  }
  if (m === "GET" && route === "/api/health") return api.health();
  if (m === "GET" && route === "/api/daily") return api.daily();
  if (m === "GET" && route === "/api/me") return api.me(query, headers);
  if (m === "GET" && route === "/api/auth/login") return api.login();
  if (m === "GET" && route === "/api/auth/callback") return api.callback(query);
  if (m === "POST" && route === "/api/guess") return api.guess(body, headers);
  if (m === "GET" && route === "/api/reveal") return api.reveal(query);
  if (m === "GET" && route === "/api/leaderboard") return api.leaderboard(query);
  if (m === "GET" && route === "/api/stats") return api.stats();
  return reply(404, { error: "not found" });
}
