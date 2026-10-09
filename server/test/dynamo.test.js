import { test } from "node:test";
import assert from "node:assert/strict";
import { createDynamoStore } from "../store/dynamo.js";
import { createFakeClient } from "./fake-dynamo.js";

const TABLE = "test-table";
const entry = (over = {}) => ({
  name: "Steve", date: "2026-10-07", puzzleNumber: 1,
  guesses: 3, won: true, timeMs: 1000, userId: "c1", createdAt: 100, ...over,
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
  // todayPlayers / todaySolved are driven by recordGuess + markSolved (i.e. by
  // actually playing), not by writing a score row.
  assert.equal(s.todayPlayers, 0);
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
  assert.equal(s.played, 1, "same user + same day is still one play");
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
  await store.addScore(entry({ userId: "a", name: "A", guesses: 4, timeMs: 10 }));
  await store.addScore(entry({ userId: "b", name: "B", guesses: 2, timeMs: 900 }));
  await store.addScore(entry({ userId: "c", name: "C", guesses: 4, timeMs: 5 }));
  await store.addScore(entry({ userId: "d", name: "D", won: false, guesses: 8 }));
  const lb = await store.leaderboard("2026-10-07");
  assert.deepEqual(lb.map((e) => e.name), ["B", "C", "A"]);
  assert.deepEqual(lb.map((e) => e.rank), [1, 2, 3]);
});

test("scores are scoped to their own day", async () => {
  const { store } = setup();
  await store.addScore(entry({ date: "2026-10-06", userId: "x" }));
  await store.addScore(entry({ date: "2026-10-07", userId: "y" }));
  assert.equal((await store.leaderboard("2026-10-07")).length, 1);
  const s = await store.globalStats("2026-10-07");
  assert.equal(s.played, 2, "counters are all-time");
  assert.equal((await store.leaderboard("2026-10-06")).length, 1, "each day has its own board");
});

test("total users counts each person once, however often they log in", async () => {
  const { store } = setup();
  await store.upsertUser({ id: "u1", username: "Steve" });
  await store.upsertUser({ id: "u1", username: "Steve" }); // logs in again
  await store.upsertUser({ id: "u2", username: "Alex" });
  const s = await store.globalStats("2026-10-07");
  assert.equal(s.totalUsers, 2);
});

test("daily players counts a person once no matter how many guesses", async () => {
  const { store } = setup();
  for (let i = 0; i < 5; i++) await store.recordGuess({ date: "2026-10-07", userId: "u1" });
  await store.recordGuess({ date: "2026-10-07", userId: "u2" });
  const s = await store.globalStats("2026-10-07");
  assert.equal(s.todayPlayers, 2, "two people played, not six guesses");
  assert.equal(s.todaySolved, 0);
});

test("daily solved counts completions, and days are independent", async () => {
  const { store } = setup();
  await store.recordGuess({ date: "2026-10-07", userId: "u1" });
  await store.markSolved({ date: "2026-10-07", userId: "u1" });
  await store.recordGuess({ date: "2026-10-08", userId: "u2" });
  const a = await store.globalStats("2026-10-07");
  const b = await store.globalStats("2026-10-08");
  assert.equal(a.todayPlayers, 1); assert.equal(a.todaySolved, 1);
  assert.equal(b.todayPlayers, 1); assert.equal(b.todaySolved, 0, "yesterday's solve doesn't leak");
});

test("consecutive puzzles build a streak", async () => {
  const { store } = setup();
  await store.recordStreak({ userId: "u1", name: "Steve", puzzleNumber: 1 });
  const s = await store.recordStreak({ userId: "u1", name: "Steve", puzzleNumber: 2 });
  assert.equal(s.streak, 2);
  assert.equal(s.maxStreak, 2);
  assert.equal((await store.topStreaks())[0].maxStreak, 2);
});

test("a missed puzzle resets the streak but the board keeps the record", async () => {
  const { store } = setup();
  await store.recordStreak({ userId: "u1", name: "Steve", puzzleNumber: 1 });
  await store.recordStreak({ userId: "u1", name: "Steve", puzzleNumber: 2 });
  const s = await store.recordStreak({ userId: "u1", name: "Steve", puzzleNumber: 5 });
  assert.equal(s.streak, 1);
  assert.equal(s.maxStreak, 2);
  const top = await store.topStreaks();
  assert.equal(top.length, 1, "one row per player");
  assert.equal(top[0].maxStreak, 2, "the personal best survives a reset");
});

test("recording the same puzzle twice does not inflate the streak", async () => {
  const { store } = setup();
  await store.recordStreak({ userId: "u1", name: "Steve", puzzleNumber: 7 });
  const s = await store.recordStreak({ userId: "u1", name: "Steve", puzzleNumber: 7 });
  assert.equal(s.streak, 1);
  assert.equal(s.maxStreak, 1);
});

test("the streak board ranks players by their longest run", async () => {
  const { store } = setup();
  for (let p = 1; p <= 3; p++) await store.recordStreak({ userId: "u1", name: "Steve", puzzleNumber: p });
  await store.recordStreak({ userId: "u2", name: "Alex", puzzleNumber: 1 });
  const top = await store.topStreaks();
  assert.deepEqual(top.map((e) => [e.rank, e.name, e.maxStreak]), [[1, "Steve", 3], [2, "Alex", 1]]);
});

test("a streak survives a profile update on re-login", async () => {
  const { store } = setup();
  await store.upsertUser({ id: "u1", username: "Steve", avatar: null });
  await store.recordStreak({ userId: "u1", name: "Steve", puzzleNumber: 1 });
  await store.upsertUser({ id: "u1", username: "Steve2", avatar: "a.png" });
  const s = await store.recordStreak({ userId: "u1", name: "Steve2", puzzleNumber: 2 });
  assert.equal(s.streak, 2, "logging in again must not wipe the streak");
});
