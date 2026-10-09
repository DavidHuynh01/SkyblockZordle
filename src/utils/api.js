// Thin API client. In dev, "/api" is proxied to the local server (see
// vite.config.js). In prod, VITE_API_URL points at the Lambda Function URL.
import { getToken } from "./auth.js";

const BASE = import.meta.env.VITE_API_URL || "/api";

const authHeaders = () => {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};

async function jget(path) {
  const r = await fetch(BASE + path, { headers: authHeaders() });
  if (!r.ok) throw new Error(`GET ${path} -> ${r.status}`);
  return r.json();
}

async function jpost(path, body) {
  const r = await fetch(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`POST ${path} -> ${r.status}`);
  return r.json();
}

export const api = {
  daily: () => jget("/daily"),
  guess: (date, itemId) => jpost("/guess", { date, itemId }),
  reveal: (date) => jget(`/reveal?date=${encodeURIComponent(date)}`),
  leaderboard: (date) => jget(date ? `/leaderboard?date=${date}` : "/leaderboard"),
  globalStats: () => jget("/stats"),
  me: () => jget("/me"),
  health: () => jget("/health"),
};

// Full-page redirect into the Discord OAuth flow.
export const loginUrl = () => `${BASE}/auth/login`;
