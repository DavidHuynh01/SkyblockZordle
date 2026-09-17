// Thin API client. In dev, "/api" is proxied to the local server (see
// vite.config.js). In prod, set VITE_API_URL if the backend is on another
// origin; otherwise same-origin "/api" is used.
const BASE = import.meta.env.VITE_API_URL || "/api";

async function jget(path) {
  const r = await fetch(BASE + path);
  if (!r.ok) throw new Error(`GET ${path} -> ${r.status}`);
  return r.json();
}

async function jpost(path, body) {
  const r = await fetch(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`POST ${path} -> ${r.status}`);
  return r.json();
}

export const api = {
  daily: () => jget("/daily"),
  guess: (date, itemId) => jpost("/guess", { date, itemId }),
  reveal: (date) => jget(`/reveal?date=${encodeURIComponent(date)}`),
  submitScore: (payload) => jpost("/score", payload),
  leaderboard: (date) => jget(date ? `/leaderboard?date=${date}` : "/leaderboard"),
  globalStats: () => jget("/stats"),
};

// A stable anonymous id for this browser (dedupes leaderboard entries).
export function getClientId() {
  const KEY = "skyblockzordle-client";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = "c_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(KEY, id);
  }
  return id;
}

const NAME_KEY = "skyblockzordle-name";
export function getPlayerName() {
  return localStorage.getItem(NAME_KEY) || "";
}
export function setPlayerName(name) {
  localStorage.setItem(NAME_KEY, name);
}
