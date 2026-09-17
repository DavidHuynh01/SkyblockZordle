# Accounts & cloud saves (Supabase + Discord login)

The game runs fine **without** this — you only need it for Discord login, a
global account leaderboard, and stats that sync across devices. Until you set
the env vars, the login button is hidden and the app uses local stats + the
anonymous JSON leaderboard.

## One-time setup (~10 min)

### 1. Create a Supabase project
- Go to https://supabase.com → New project (free tier). Note the project URL.

### 2. Create the tables
- Dashboard → **SQL Editor** → paste all of [`schema.sql`](./schema.sql) → **Run**.
  This creates the `profiles`, `user_stats`, and `scores` tables, security
  policies, the auto-profile trigger, and the `global_stats()` function.

### 3. Create a Discord application (for OAuth)
- https://discord.com/developers/applications → **New Application**.
- **OAuth2** tab → copy the **Client ID** and **Client Secret**.
- Add a **redirect URL**: your Supabase callback, shown in the next step
  (looks like `https://YOUR-PROJECT.supabase.co/auth/v1/callback`).

### 4. Turn on Discord auth in Supabase
- Dashboard → **Authentication → Providers → Discord** → enable it.
- Paste the Discord **Client ID** + **Client Secret**. Save.
- Copy the **Callback URL** shown here into the Discord app's redirect URLs (step 3).
- **Authentication → URL Configuration** → set **Site URL** to where the app
  runs (e.g. `http://localhost:5173` for dev, your real domain in prod), and add
  both to **Redirect URLs**.

### 5. Point the app at Supabase
- Copy `.env.example` → `.env` in the project root and fill in:
  ```
  VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-public-key   # Settings → API → anon/public
  ```
  (The **anon** key is public and safe in the frontend — Row Level Security
  protects the data. Never put the **service_role** key in the frontend.)
- Restart `npm run dev`. A **Login with Discord** button appears on the menu.

## What you get
- **Discord login** on the menu.
- **Stats sync** across devices for logged-in users (stored in `user_stats`).
- **Account leaderboard** — daily solves tied to your Discord name/avatar.
- Global stats come from the `global_stats()` SQL function.

## Deploying
Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as build-time env vars on
your host (Render/DO/etc.), and add your production domain to Supabase's Site URL
+ Redirect URLs and the Discord app's redirect URLs.
