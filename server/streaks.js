// Streak maths, kept pure so both stores share one implementation and the
// rules are testable without a database.
//
// A streak counts consecutive *puzzle numbers* solved. It only ever walks
// forward: a guess carries its own date, so if an older puzzle could move the
// streak, replaying a past day would reset your own run.

export const TOP_LIMIT = 10;

export function nextStreak(profile, puzzleNumber) {
  const streak = Number(profile?.streak || 0);
  const maxStreak = Number(profile?.maxStreak || 0);
  const last = profile?.lastSolvedPuzzle ?? null;

  // Already credited for this puzzle, or an older one: nothing to do.
  if (last !== null && puzzleNumber <= last) {
    return { streak, maxStreak, lastSolvedPuzzle: last, changed: false, improved: false };
  }

  const run = last === puzzleNumber - 1 ? streak + 1 : 1;
  const best = Math.max(maxStreak, run);
  return {
    streak: run,
    maxStreak: best,
    lastSolvedPuzzle: puzzleNumber,
    changed: true,
    improved: best > maxStreak,
  };
}

// Folds one player's record into the top list: one row per player, longest
// streak first, ties going to whoever reached it first.
export function mergeTop(list, entry, limit = TOP_LIMIT) {
  return [...(list || []).filter((e) => e.userId !== entry.userId), entry]
    .sort((a, b) => b.maxStreak - a.maxStreak || (a.at || 0) - (b.at || 0))
    .slice(0, limit);
}

// Shapes the stored list for the API: no user ids leave the server.
export function publicTop(list, limit = TOP_LIMIT) {
  return (list || []).slice(0, limit).map((e, i) => ({
    rank: i + 1,
    name: e.name,
    avatar: e.avatar || null,
    maxStreak: Number(e.maxStreak || 0),
  }));
}
