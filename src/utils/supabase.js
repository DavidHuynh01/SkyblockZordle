import { createClient } from "@supabase/supabase-js";

// Supabase is OPTIONAL. Without the two env vars the whole accounts/auth layer
// stays dormant and the game runs exactly as before (anonymous, local stats,
// JSON-file leaderboard). Set them in a .env file to enable Discord login.
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const authEnabled = Boolean(url && key);
export const supabase = authEnabled ? createClient(url, key) : null;

// Pull a friendly name + avatar out of the Discord user metadata.
export function profileFromUser(user) {
  if (!user) return null;
  const m = user.user_metadata || {};
  return {
    id: user.id,
    name: m.full_name || m.name || m.user_name || m.preferred_username || "Player",
    avatar: m.avatar_url || m.picture || null,
  };
}
