// Stateless auth helpers: signed session tokens and OAuth CSRF state.
// Both are HMAC-SHA256 over a base64url payload, so nothing needs storing.
import { createHmac, timingSafeEqual, randomBytes } from "crypto";

const b64 = (buf) => Buffer.from(buf).toString("base64url");
const unb64 = (s) => Buffer.from(s, "base64url").toString("utf8");

function sign(payloadB64, secret) {
  return createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

function safeEqual(a, b) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

// ---- session tokens -------------------------------------------------------

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function createSessionToken(user, secret, now = Date.now()) {
  const payload = b64(
    JSON.stringify({ sub: user.id, name: user.username, avatar: user.avatar || null, exp: now + SESSION_TTL_MS })
  );
  return `${payload}.${sign(payload, secret)}`;
}

// Returns the user payload, or null if the token is missing/forged/expired.
export function verifySessionToken(token, secret, now = Date.now()) {
  if (typeof token !== "string") return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  if (!safeEqual(sig, sign(payload, secret))) return null;
  let data;
  try {
    data = JSON.parse(unb64(payload));
  } catch {
    return null;
  }
  if (!data?.sub || typeof data.exp !== "number" || data.exp < now) return null;
  return { id: data.sub, username: data.name, avatar: data.avatar };
}

export function bearerFrom(headers = {}) {
  const h = headers.authorization || headers.Authorization || "";
  const m = /^Bearer (.+)$/.exec(h);
  return m ? m[1] : null;
}

// ---- OAuth state (CSRF) ---------------------------------------------------

export const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function createState(secret, now = Date.now()) {
  const payload = b64(JSON.stringify({ n: randomBytes(12).toString("hex"), t: now }));
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyState(state, secret, now = Date.now()) {
  if (typeof state !== "string") return false;
  const [payload, sig] = state.split(".");
  if (!payload || !sig) return false;
  if (!safeEqual(sig, sign(payload, secret))) return false;
  try {
    const { t } = JSON.parse(unb64(payload));
    return typeof t === "number" && now - t < STATE_TTL_MS && now - t >= 0;
  } catch {
    return false;
  }
}
