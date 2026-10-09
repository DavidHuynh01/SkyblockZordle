import { test } from "node:test";
import assert from "node:assert/strict";
import { createApi, handleRequest } from "../api.js";
import { utcDateKey, answerFor } from "../logic.js";
import { createSessionToken } from "../auth.js";
import { createDynamoStore } from "../store/dynamo.js";
import { createFakeClient } from "./fake-dynamo.js";

const CONFIG = {
  sessionSecret: "s3cret",
  discordClientId: "client-id",
  discordClientSecret: "client-secret",
  redirectUri: "https://api.example.com/api/auth/callback",
  siteUrl: "https://site.example.com",
};
const USER = { id: "u1", username: "Steve", avatar: null };
const today = () => utcDateKey();
const wrongItem = () => (answerFor(today()).id === "hyperion" ? "terminator" : "hyperion");

function setup({ fetchImpl } = {}) {
  const store = createDynamoStore({ client: createFakeClient(), tableName: "t" });
  return { store, api: createApi(store, CONFIG, { fetchImpl }) };
}
const auth = (user = USER) => ({ authorization: `Bearer ${createSessionToken(user, CONFIG.sessionSecret)}` });
const call = (api, req) => handleRequest(api, req);

test("daily never includes the answer", async () => {
  const { api } = setup();
  const res = await call(api, { method: "GET", path: "/api/daily" });
  assert.equal(res.status, 200);
  assert.equal(JSON.stringify(res.body).includes("answer"), false);
});

test("a wrong guess withholds the answer", async () => {
  const { api } = setup();
  const res = await call(api, { method: "POST", path: "/api/guess", body: { itemId: wrongItem() } });
  assert.equal(res.body.correct, false);
  assert.equal(res.body.answer, undefined);
});

test("there is no way to post a score directly", async () => {
  const { api, store } = setup();
  const res = await call(api, {
    method: "POST", path: "/api/score",
    body: { name: "FakeHacker", guesses: 1, won: true },
  });
  assert.equal(res.status, 404, "the client-trusted score endpoint must not exist");
  assert.equal((await store.leaderboard(today())).length, 0);
});

test("an anonymous solve does not reach the leaderboard", async () => {
  const { api, store } = setup();
  const res = await call(api, {
    method: "POST", path: "/api/guess",
    body: { itemId: answerFor(today()).id },
  });
  assert.equal(res.body.correct, true);
  assert.equal((await store.leaderboard(today())).length, 0, "login is required to be ranked");
});

test("a signed-in solve is recorded with the server's own guess count", async () => {
  const { api, store } = setup();
  // three wrong guesses, then the right one
  for (let i = 0; i < 3; i++) {
    await call(api, { method: "POST", path: "/api/guess", body: { itemId: wrongItem() }, headers: auth() });
  }
  const res = await call(api, {
    method: "POST", path: "/api/guess",
    body: { itemId: answerFor(today()).id, guesses: 1 }, // client lies about the count
    headers: auth(),
  });
  assert.equal(res.body.correct, true);
  const lb = await store.leaderboard(today());
  assert.equal(lb.length, 1);
  assert.equal(lb[0].name, "Steve");
  assert.equal(lb[0].guesses, 4, "the server's count wins, not the client's claim");
});

test("a forged session token cannot score", async () => {
  const { api, store } = setup();
  const forged = { authorization: `Bearer ${createSessionToken(USER, "wrong-secret")}` };
  await call(api, { method: "POST", path: "/api/guess", body: { itemId: answerFor(today()).id }, headers: forged });
  assert.equal((await store.leaderboard(today())).length, 0);
});

test("solving twice does not overwrite the first result", async () => {
  const { api, store } = setup();
  await call(api, { method: "POST", path: "/api/guess", body: { itemId: answerFor(today()).id }, headers: auth() });
  await call(api, { method: "POST", path: "/api/guess", body: { itemId: answerFor(today()).id }, headers: auth() });
  const lb = await store.leaderboard(today());
  assert.equal(lb.length, 1);
  assert.equal(lb[0].guesses, 1, "the original solve stands");
});

test("burning all 8 guesses then guessing right earns no score", async () => {
  const { api, store } = setup();
  for (let i = 0; i < 8; i++) {
    await call(api, { method: "POST", path: "/api/guess", body: { itemId: wrongItem() }, headers: auth() });
  }
  await call(api, { method: "POST", path: "/api/guess", body: { itemId: answerFor(today()).id }, headers: auth() });
  assert.equal((await store.leaderboard(today())).length, 0, "brute forcing past 8 guesses must not rank");
});

test("/api/me reflects the session", async () => {
  const { api } = setup();
  assert.equal((await call(api, { method: "GET", path: "/api/me" })).status, 401);
  const ok = await call(api, { method: "GET", path: "/api/me", headers: auth() });
  assert.equal(ok.body.user.username, "Steve");
});

test("login redirects to Discord with a state parameter", async () => {
  const { api } = setup();
  const res = await call(api, { method: "GET", path: "/api/auth/login" });
  assert.equal(res.status, 302);
  const url = new URL(res.headers.location);
  assert.equal(url.host, "discord.com");
  assert.equal(url.searchParams.get("client_id"), CONFIG.discordClientId);
  assert.equal(url.searchParams.get("scope"), "identify");
  assert.ok(url.searchParams.get("state"));
});

test("the callback rejects a bad state (CSRF) without calling Discord", async () => {
  let called = false;
  const { api } = setup({ fetchImpl: async () => { called = true; return { ok: false, status: 400 }; } });
  const res = await call(api, { method: "GET", path: "/api/auth/callback", query: { code: "x", state: "forged" } });
  assert.equal(res.status, 302);
  assert.match(res.headers.location, /login=failed/);
  assert.equal(called, false);
});

test("a successful callback stores the user and hands back a token", async () => {
  const fetchImpl = async (url) => {
    if (String(url).includes("/token")) return { ok: true, json: async () => ({ access_token: "at" }) };
    return { ok: true, json: async () => ({ id: "777", username: "Alex", avatar: "hash" }) };
  };
  const { api, store } = setup({ fetchImpl });
  const login = await call(api, { method: "GET", path: "/api/auth/login" });
  const state = new URL(login.headers.location).searchParams.get("state");
  const res = await call(api, { method: "GET", path: "/api/auth/callback", query: { code: "good", state } });
  assert.equal(res.status, 302);
  assert.match(res.headers.location, /^https:\/\/site\.example\.com\/#token=/);
  assert.ok(store);
});

test("auth routes are disabled when Discord is not configured", async () => {
  const store = createDynamoStore({ client: createFakeClient(), tableName: "t" });
  const api = createApi(store, { siteUrl: "x" });
  assert.equal(api.authEnabled, false);
  assert.equal((await call(api, { method: "GET", path: "/api/auth/login" })).status, 503);
  // the game itself still works
  assert.equal((await call(api, { method: "GET", path: "/api/daily" })).status, 200);
});
