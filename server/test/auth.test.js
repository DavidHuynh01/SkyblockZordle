import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createSessionToken, verifySessionToken, bearerFrom,
  createState, verifyState, SESSION_TTL_MS, STATE_TTL_MS,
} from "../auth.js";

const SECRET = "test-secret";
const USER = { id: "123", username: "Steve", avatar: "abc" };

test("a signed session token round-trips", () => {
  const u = verifySessionToken(createSessionToken(USER, SECRET), SECRET);
  assert.equal(u.id, "123");
  assert.equal(u.username, "Steve");
});

test("a token signed with another secret is rejected", () => {
  assert.equal(verifySessionToken(createSessionToken(USER, "other"), SECRET), null);
});

test("a tampered payload is rejected", () => {
  const [p, s] = createSessionToken(USER, SECRET).split(".");
  const forged = Buffer.from(JSON.stringify({ sub: "999", name: "Admin", exp: Date.now() + 1e6 })).toString("base64url");
  assert.equal(verifySessionToken(`${forged}.${s}`, SECRET), null);
  assert.equal(verifySessionToken(`${p}.${"x".repeat(43)}`, SECRET), null);
});

test("an expired token is rejected", () => {
  const t = createSessionToken(USER, SECRET, Date.now() - SESSION_TTL_MS - 1000);
  assert.equal(verifySessionToken(t, SECRET), null);
});

test("garbage tokens are rejected, not crashes", () => {
  for (const bad of [null, undefined, "", "nodot", "a.b", 42, {}]) {
    assert.equal(verifySessionToken(bad, SECRET), null);
  }
});

test("bearer header parsing", () => {
  assert.equal(bearerFrom({ authorization: "Bearer xyz" }), "xyz");
  assert.equal(bearerFrom({ Authorization: "Bearer xyz" }), "xyz");
  assert.equal(bearerFrom({ authorization: "Basic xyz" }), null);
  assert.equal(bearerFrom({}), null);
});

test("oauth state round-trips and expires", () => {
  const s = createState(SECRET);
  assert.equal(verifyState(s, SECRET), true);
  assert.equal(verifyState(s, "other"), false);
  assert.equal(verifyState(createState(SECRET, Date.now() - STATE_TTL_MS - 1), SECRET), false);
  assert.equal(verifyState("junk", SECRET), false);
});
