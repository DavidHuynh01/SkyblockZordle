// Player stats. Same shape is used locally (localStorage, anonymous) and
// remotely (Supabase user_stats, when logged in) — the update logic is a pure
// function so both paths share it.

const STATS_KEY = "skyblockzordle-stats-v1";

export const EMPTY = {
  played: 0,
  wins: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastWonPuzzle: null, // puzzle number of the most recent win (for streaks)
  lastRecordedPuzzle: null, // guard against double-counting the same puzzle
  dist: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 },
};

// Pure: given prior stats + a result, return the new stats. Idempotent per
// puzzle number (recording the same puzzle twice is a no-op).
export function applyResult(prev, { won, guesses, puzzleNumber }) {
  const s = {
    ...EMPTY,
    ...prev,
    dist: { ...EMPTY.dist, ...(prev?.dist || {}) },
  };
  if (s.lastRecordedPuzzle === puzzleNumber) return s;

  s.played += 1;
  if (won) {
    s.wins += 1;
    s.currentStreak = s.lastWonPuzzle === puzzleNumber - 1 ? s.currentStreak + 1 : 1;
    s.maxStreak = Math.max(s.maxStreak, s.currentStreak);
    s.lastWonPuzzle = puzzleNumber;
    if (s.dist[guesses] != null) s.dist[guesses] += 1;
  } else {
    s.currentStreak = 0;
  }
  s.lastRecordedPuzzle = puzzleNumber;
  return s;
}

export function getStats() {
  try {
    const s = JSON.parse(localStorage.getItem(STATS_KEY));
    return s ? { ...EMPTY, ...s, dist: { ...EMPTY.dist, ...(s.dist || {}) } } : { ...EMPTY };
  } catch {
    return { ...EMPTY };
  }
}

// Local (anonymous) record: read → apply → persist.
export function recordResult({ won, guesses, puzzleNumber }) {
  const updated = applyResult(getStats(), { won, guesses, puzzleNumber });
  localStorage.setItem(STATS_KEY, JSON.stringify(updated));
  return updated;
}

export function winPercent(s) {
  return s && s.played ? Math.round((s.wins / s.played) * 100) : 0;
}
