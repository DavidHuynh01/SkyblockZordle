import { test } from "node:test";
import assert from "node:assert/strict";
import { createApi, handleRequest } from "../api.js";
import { utcDateKey, answerFor } from "../logic.js";
import { handler } from "../../lambda/handler.js";

function memoryStore() {
  const scores = [];
  return {
    scores,
    async addScore(e) { scores.push(e); },
    async leaderboard() { return []; },
    async globalStats() { return { played: scores.length }; },
  };
}
const call = (store, req) => handleRequest(createApi(store), req);
const get = (path, query = {}) => ({ method: "GET", path, query });
const post = (path, body) => ({ method: "POST", path, body });

test("daily returns a date and puzzle number but never the answer", async () => {
  const res = await call(memoryStore(), get("/api/daily"));
  assert.equal(res.status, 200);
  assert.equal(res.body.date, utcDateKey());
  assert.ok(res.body.puzzleNumber > 0);
  assert.equal(JSON.stringify(res.body).includes("answer"), false);
});

test("a wrong guess returns comparisons but withholds the answer", async () => {
  const today = utcDateKey();
  const wrong = answerFor(today).id === "hyperion" ? "terminator" : "hyperion";
  const res = await call(memoryStore(), post("/api/guess", { date: today, itemId: wrong }));
  assert.equal(res.status, 200);
  assert.equal(res.body.correct, false);
  assert.equal(res.body.answer, undefined, "the answer must not leak on a wrong guess");
  assert.ok(res.body.result.rarity.status);
});

test("a correct guess reveals the answer", async () => {
  const today = utcDateKey();
  const res = await call(memoryStore(), post("/api/guess", { date: today, itemId: answerFor(today).id }));
  assert.equal(res.body.correct, true);
  assert.equal(res.body.answer.id, answerFor(today).id);
});

test("an unknown item is rejected", async () => {
  const res = await call(memoryStore(), post("/api/guess", { itemId: "not_a_real_item" }));
  assert.equal(res.status, 400);
});

test("score rejects out-of-range guess counts", async () => {
  const store = memoryStore();
  for (const guesses of [0, 9, "3", undefined]) {
    assert.equal((await call(store, post("/api/score", { guesses }))).status, 400);
  }
  assert.equal(store.scores.length, 0);
});

test("score sanitises the display name and stores the entry", async () => {
  const store = memoryStore();
  const res = await call(store, post("/api/score", { name: "<script>evil</script>", guesses: 3, won: true }));
  assert.equal(res.status, 200);
  const name = store.scores[0].name;
  // Note: the name is truncated to 16 chars first, then unsafe characters are
  // stripped, so the stored value can be shorter. Behaviour kept from the
  // original Express server.
  assert.equal(/[<>/]/.test(name), false, "markup characters must be stripped");
  assert.ok(name.length > 0 && name.length <= 16);
});

test("a blank name falls back to Anonymous", async () => {
  const store = memoryStore();
  await call(store, post("/api/score", { name: "!!!", guesses: 2, won: true }));
  assert.equal(store.scores[0].name, "Anonymous");
});

test("unknown routes 404 and OPTIONS preflight succeeds", async () => {
  assert.equal((await call(memoryStore(), get("/api/nope"))).status, 404);
  assert.equal((await call(memoryStore(), { method: "OPTIONS", path: "/api/score" })).status, 204);
});

test("lambda handler speaks Function URL events", async () => {
  const res = await handler({
    rawPath: "/api/daily",
    requestContext: { http: { method: "GET" } },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers["content-type"], "application/json");
  // CORS is owned by the Function URL config, not the handler (duplicate
  // Access-Control-Allow-Origin headers break the browser).
  assert.equal(res.headers["access-control-allow-origin"], undefined);
  assert.equal(JSON.parse(res.body).date, utcDateKey());
});

test("lambda handler rejects malformed JSON bodies", async () => {
  const res = await handler({
    rawPath: "/api/guess",
    requestContext: { http: { method: "POST" } },
    body: "{not json",
  });
  assert.equal(res.statusCode, 400);
});

test("lambda handler decodes base64 bodies", async () => {
  const today = utcDateKey();
  const res = await handler({
    rawPath: "/api/guess",
    requestContext: { http: { method: "POST" } },
    isBase64Encoded: true,
    body: Buffer.from(JSON.stringify({ date: today, itemId: answerFor(today).id })).toString("base64"),
  });
  assert.equal(JSON.parse(res.body).correct, true);
});
