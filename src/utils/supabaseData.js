import { supabase } from "./supabase.js";
import { EMPTY } from "./stats.js";

// Map between our camelCase stats and the snake_case DB columns.
function rowToStats(r) {
  if (!r) return { ...EMPTY };
  return {
    played: r.played,
    wins: r.wins,
    currentStreak: r.current_streak,
    maxStreak: r.max_streak,
    lastWonPuzzle: r.last_won_puzzle,
    lastRecordedPuzzle: r.last_recorded_puzzle,
    dist: { ...EMPTY.dist, ...(r.dist || {}) },
  };
}

export async function fetchUserStats(userId) {
  const { data, error } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return rowToStats(data);
}

export async function saveUserStats(userId, s) {
  const { error } = await supabase.from("user_stats").upsert(
    {
      user_id: userId,
      played: s.played,
      wins: s.wins,
      current_streak: s.currentStreak,
      max_streak: s.maxStreak,
      last_won_puzzle: s.lastWonPuzzle,
      last_recorded_puzzle: s.lastRecordedPuzzle,
      dist: s.dist,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) throw error;
}

export async function submitScore(userId, { date, puzzleNumber, guesses, won, timeMs }) {
  const { error } = await supabase.from("scores").upsert(
    {
      user_id: userId,
      date,
      puzzle_number: puzzleNumber,
      guesses,
      won,
      time_ms: timeMs || 0,
    },
    { onConflict: "user_id,date" }
  );
  if (error) throw error;
}

export async function fetchLeaderboard(date) {
  const { data, error } = await supabase
    .from("scores")
    .select("guesses, time_ms, profiles ( username, avatar_url )")
    .eq("date", date)
    .eq("won", true)
    .order("guesses", { ascending: true })
    .order("time_ms", { ascending: true })
    .limit(50);
  if (error) throw error;
  return (data || []).map((r, i) => ({
    rank: i + 1,
    name: r.profiles?.username || "Player",
    avatar: r.profiles?.avatar_url || null,
    guesses: r.guesses,
    timeMs: r.time_ms,
  }));
}

export async function fetchGlobalStats() {
  const { data, error } = await supabase.rpc("global_stats");
  if (error) throw error;
  return data;
}
