// Runtime config. Secrets come from SSM Parameter Store in AWS (free tier) and
// from env vars locally. Never from the repo.
let cached = null;

async function fromSsm(prefix) {
  const { SSMClient, GetParametersCommand } = await import("@aws-sdk/client-ssm");
  const ssm = new SSMClient({});
  const names = [`${prefix}/discord_client_id`, `${prefix}/discord_client_secret`, `${prefix}/session_secret`];
  const res = await ssm.send(new GetParametersCommand({ Names: names, WithDecryption: true }));
  const get = (n) => res.Parameters?.find((p) => p.Name === n)?.Value;
  return {
    discordClientId: get(names[0]),
    discordClientSecret: get(names[1]),
    sessionSecret: get(names[2]),
  };
}

export async function loadConfig() {
  if (cached) return cached;
  const base = {
    siteUrl: (process.env.SITE_URL || "http://localhost:5173").replace(/\/$/, ""),
    redirectUri: process.env.REDIRECT_URI || "http://localhost:3001/api/auth/callback",
  };

  // Local dev / tests: plain env vars win.
  if (process.env.DISCORD_CLIENT_SECRET) {
    cached = {
      ...base,
      discordClientId: process.env.DISCORD_CLIENT_ID,
      discordClientSecret: process.env.DISCORD_CLIENT_SECRET,
      sessionSecret: process.env.SESSION_SECRET,
    };
    return cached;
  }

  if (process.env.SSM_PREFIX) {
    try {
      cached = { ...base, ...(await fromSsm(process.env.SSM_PREFIX)) };
      return cached;
    } catch (err) {
      console.error("could not load secrets from SSM:", err.message);
    }
  }

  cached = base; // auth stays disabled; the game still works anonymously
  return cached;
}
