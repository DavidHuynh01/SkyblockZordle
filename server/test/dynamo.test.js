import { test } from "node:test";
import assert from "node:assert/strict";
import { createDynamoStore } from "../store/dynamo.js";
import { createFakeClient } from "./fake-dynamo.js";

const TABLE = "test-table";
const entry = (over = {}) => ({
  name: "Steve", date: "2026-10-07", puzzleNumber: 1,
  guesses: 3, won: true, timeMs: 1000, clientId: "c1", createdAt: 100, ...over,
});
const setup = () => {
  const client = createFakeClient();
  return { client, store: createDynamoStore({ client, tableName: TABLE }) };
};

test("requires a table name", () => {
  assert.throws(() => createDynamoStore({ client: createFakeClient() }), /tableName/);
});

test("a new score increments the global counters", async () => {
  const { store } = setup();
  await store.addScore(entry());
  const s = await store.globalStats("2026-10-07");
  assert.equal(s.played, 1);
  assert.equal(s.wins, 1);
  assert.equal(s.winPercent, 100);
  assert.equal(s.dist[3], 1);
  assert.equal(s.todayPlayers, 1);
  assert.equal(s.todaySolved, 1);
});

test("a loss counts as played but not won", async () => {
  const { store } = setup();
  await store.addScore(entry({ won: false, guesses: 8 }));
  const s = await store.globalStats("2026-10-07");
  assert.equal(s.played, 1);
  assert.equal(s.wins, 0);
  assert.equal(s.dist[8], 0, "a loss must not land in the guess distribution");
});

test("re-submitting the same day does not double-count played", async () => {
  const { store } = setup();
  await store.addScore(entry({ name: "Steve", guesses: 3 }));
  await store.addScore(entry({ name: "Renamed", guesses: 3 }));
  const s = await store.globalStats("2026-10-07");
  assert.equal(s.played, 1, "same player + same day is still one play");
  assert.equal(s.wins, 1);
  assert.equal(s.dist[3], 1);
  const lb = await store.leaderboard("2026-10-07");
  assert.equal(lb.length, 1);
  assert.equal(lb[0].name, "Renamed", "the row should be replaced, not duplicated");
});

test("a re-submission that changes the result corrects the counters", async () => {
  const { store } = setup();
  await store.addScore(entry({ won: false, guesses: 8 }));
  await store.addScore(entry({ won: true, guesses: 4 }));
  const s = await store.globalStats("2026-10-07");
  assert.equal(s.played, 1);
  assert.equal(s.wins, 1);
  assert.equal(s.dist[4], 1);
  assert.equal(s.dist[8], 0);
});

test("leaderboard ranks by guesses, then time, and excludes losses", async () => {
  const { store } = setup();
  await store.addScore(entry({ clientId: "a", name: "A", guesses: 4, timeMs: 10 }));
  await store.addScore(entry({ clientId: "b", name: "B", guesses: 2, timeMs: 900 }));
  await store.addScore(entry({ clientId: "c", name: "C", guesses: 4, timeMs: 5 }));
  await store.addScore(entry({ clientId: "d", name: "D", won: false, guesses: 8 }));
  const lb = await store.leaderboard("2026-10-07");
  assert.deepEqual(lb.map((e) => e.name), ["B", "C", "A"]);
  assert.deepEqual(lb.map((e) => e.rank), [1, 2, 3]);
});

test("scores are scoped to their own day", async () => {
  const { store } = setup();
  await store.addScore(entry({ date: "2026-10-06", clientId: "x" }));
  await store.addScore(entry({ date: "2026-10-07", clientId: "y" }));
  assert.equal((await store.leaderboard("2026-10-07")).length, 1);
  const s = await store.globalStats("2026-10-07");
  assert.equal(s.played, 2, "counters are all-time");
  assert.equal(s.todayPlayers, 1, "today is one day only");
});
