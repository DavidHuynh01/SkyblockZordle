// The production store (store/dynamo.js) against a real DynamoDB engine. The
// unit tests cover the same logic with a hand-written fake; these prove the
// actual expressions, conditions and counters behave on DynamoDB itself.
//
// Every test gets its own empty table, and every date, puzzle number and time
// is fixed, so nothing depends on test order or on the real clock.
import { test } from "node:test";
import assert from "node:assert/strict";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { openTestStore } from "./helper.js";

const DAY = "2026-09-01";
const score = (over = {}) => ({
  userId: "u1", name: "Steve", avatar: null, date: DAY, puzzleNumber: 1,
  guesses: 3, won: true, timeMs: 1000, createdAt: 100, ...over,
});

async function fresh(t) {
  const db = await openTestStore("store");
  t.after(() => db.drop());
  return db;
}

test("a first score is saved and counted", async (t) => {
  const { store } = await fresh(t);
  await store.addScore(score());
  const s = await store.globalStats(DAY);
  assert.equal(s.played, 1);
  assert.equal(s.wins, 1);
  assert.equal(s.dist[3], 1);
  assert.equal((await store.leaderboard(DAY)).length, 1);
});

test("re-submitting the same day replaces the score and corrects the counters", async (t) => {
  const { store } = await fresh(t);
  await store.addScore(score({ guesses: 5 }));
  await store.addScore(score({ guesses: 2 }));
  const s = await store.globalStats(DAY);
  assert.equal(s.played, 1, "still one game played");
  assert.equal(s.wins, 1);
  assert.equal(s.dist[5], 0, "the old guess count is taken back out");
  assert.equal(s.dist[2], 1);
  const board = await store.leaderboard(DAY);
  assert.deepEqual(board.map((e) => e.guesses), [2]);
});

test("the leaderboard ranks by guesses, then time, then who finished first, and leaves out losses", async (t) => {
  const { store } = await fresh(t);
  await store.addScore(score({ userId: "slow", name: "Slow", guesses: 2, timeMs: 9000 }));
  await store.addScore(score({ userId: "fast", name: "Fast", guesses: 2, timeMs: 1000 }));
  await store.addScore(score({ userId: "tied", name: "Tied", guesses: 2, timeMs: 1000, createdAt: 200 }));
  await store.addScore(score({ userId: "four", name: "Four", guesses: 4 }));
  await store.addScore(score({ userId: "lost", name: "Lost", guesses: 10, won: false }));
  const board = await store.leaderboard(DAY);
  assert.deepEqual(board.map((e) => e.name), ["Fast", "Tied", "Slow", "Four"]);
  assert.deepEqual(board.map((e) => e.rank), [1, 2, 3, 4]);
  assert.equal(JSON.stringify(board).includes("userId"), false, "no user ids leave the server");
});

test("today's player and solve counts come from actual play", async (t) => {
  const { store } = await fresh(t);
  await store.recordGuess({ date: DAY, userId: "a", now: 1 });
  await store.recordGuess({ date: DAY, userId: "a", now: 2 });
  await store.recordGuess({ date: DAY, userId: "b", now: 3 });
  await store.markSolved({ date: DAY, userId: "a", now: 4 });
  const s = await store.globalStats(DAY);
  assert.equal(s.todayPlayers, 2, "a player counts once however many guesses they make");
  assert.equal(s.todaySolved, 1);
  assert.equal((await store.globalStats("2026-09-02")).todayPlayers, 0, "days are counted separately");
});

test("guesses are counted server-side and the start time is kept from the first guess", async (t) => {
  const { store } = await fresh(t);
  await store.recordGuess({ date: DAY, userId: "a", now: 1000 });
  const second = await store.recordGuess({ date: DAY, userId: "a", now: 5000 });
  assert.equal(second.guesses, 2);
  assert.equal(second.startedAt, 1000);
  assert.equal(second.solved, false);
});

test("streaks extend on consecutive puzzles, reset after a gap, and remember the best", async (t) => {
  const { store } = await fresh(t);
  const solve = (p) => store.recordStreak({ userId: "u1", name: "Steve", puzzleNumber: p, now: p });
  await solve(1);
  await solve(2);
  assert.deepEqual(await solve(3), { streak: 3, maxStreak: 3 });
  assert.deepEqual(await solve(5), { streak: 1, maxStreak: 3 }, "missing puzzle 4 resets the run");
  assert.deepEqual(await solve(5), { streak: 1, maxStreak: 3 }, "the same puzzle never counts twice");
  assert.deepEqual(await solve(4), { streak: 1, maxStreak: 3 }, "an older puzzle can't move the streak");
});

test("the streak board keeps the top 10 and shows no user ids", async (t) => {
  const { store } = await fresh(t);
  for (let i = 1; i <= 12; i++) {
    for (let p = 1; p <= i; p++) {
      await store.recordStreak({ userId: `u${i}`, name: `P${i}`, puzzleNumber: p, now: i * 100 + p });
    }
  }
  const top = await store.topStreaks();
  assert.equal(top.length, 10);
  assert.equal(top[0].name, "P12");
  assert.equal(top[0].maxStreak, 12);
  assert.equal(top.at(-1).name, "P3");
  assert.equal(JSON.stringify(top).includes("userId"), false);
});

test("logging in again keeps the player's streak and join date (regression)", async (t) => {
  // An earlier version replaced the whole profile row on every login, which
  // silently wiped the streak. Login must only update the profile fields.
  const { store, client, tableName } = await fresh(t);
  await store.upsertUser({ id: "u1", username: "Steve", avatar: null }, { now: 1000 });
  for (const p of [1, 2, 3]) await store.recordStreak({ userId: "u1", name: "Steve", puzzleNumber: p, now: p });

  await store.upsertUser({ id: "u1", username: "Steve2", avatar: "new.png" }, { now: 9000 });

  const { Item } = await client.send(new GetCommand({ TableName: tableName, Key: { pk: "USER#u1", sk: "PROFILE" } }));
  assert.equal(Item.username, "Steve2");
  assert.equal(Item.avatar, "new.png");
  assert.equal(Item.lastLogin, 9000);
  assert.equal(Item.createdAt, 1000, "join date survives");
  assert.equal(Item.streak, 3, "streak survives");
  assert.equal(Item.maxStreak, 3);
  assert.equal(Item.lastSolvedPuzzle, 3);
  assert.equal((await store.globalStats(DAY)).totalUsers, 1, "a returning player is counted once");
});
