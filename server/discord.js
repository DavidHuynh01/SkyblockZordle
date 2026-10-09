// Discord OAuth2 (identify scope only — we never see the user's email).
const AUTHORIZE = "https://discord.com/api/oauth2/authorize";
const TOKEN = "https://discord.com/api/oauth2/token";
const ME = "https://discord.com/api/users/@me";

export function authorizeUrl({ clientId, redirectUri, state }) {
  const q = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify",
    state,
  });
  return `${AUTHORIZE}?${q}`;
}

// `fetchImpl` is injectable so tests don't hit the network.
export async function exchangeCode({ code, clientId, clientSecret, redirectUri }, fetchImpl = fetch) {
  const res = await fetchImpl(TOKEN, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }).toString(),
  });
  if (!res.ok) throw new Error(`discord token exchange failed: ${res.status}`);
  const json = await res.json();
  if (!json.access_token) throw new Error("discord token exchange returned no access_token");
  return json.access_token;
}

export async function fetchUser(accessToken, fetchImpl = fetch) {
  const res = await fetchImpl(ME, { headers: { authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`discord user fetch failed: ${res.status}`);
  const u = await res.json();
  if (!u?.id) throw new Error("discord user fetch returned no id");
  return {
    id: String(u.id),
    username: u.global_name || u.username || "Player",
    avatar: u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=64` : null,
  };
}
