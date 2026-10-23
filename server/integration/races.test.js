// Concurrent writes, fired together with Promise.all against a real DynamoDB.
// A fake can't show these: the bugs only appear when two requests interleave
// inside the database.
import { test } from "node:test";
import assert from "node:assert/strict";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { openTestStore } from "./helper.js";
import { createApi } from "../api.js";
import { answerFor } from "../logic.js";
import { createSessionToken } from "../auth.js";

const DAY = "2026-09-01";

async function fresh(t) {
  const db = await openTestStore("races");
  t.after(() => db.drop());
  return db;
}

test("counters stay exact under many simultaneous writes", async (t) => {
  // Counters use DynamoDB's atomic ADD, so no increment can be lost.
  const { store } = await fresh(t);
  const players = Array.from({ length: 25 }, (_, i) => `p${i}`);
  await Promise.all(players.map((userId, i) => store.recordGuess({ date: DAY, userId, now: i })));
  await Promise.all(players.map((userId, i) => store.addScore({
    userId, name: userId, date: DAY, puzzleNumber: 1,
    guesses: (i % 10) + 1, won: i % 5 !== 0, timeMs: i, createdAt: i,
  })));
  const s = await store.globalStats(DAY);
  assert.equal(s.todayPlayers, 25);
  assert.equal(s.played, 25);
  assert.equal(s.wins, 20);
  assert.equal(Object.values(s.dist).reduce((a, b) => a + b, 0), 20);
});

test("records beaten at the same moment all reach the streak board", async (t) => {
  // The board is one item that is read, merged and written back. Without a
  // guard, two writers both read the old list and the second write erases
  // the first player's record.
  const { store } = await fresh(t);
  const players = ["a", "b", "c", "d", "e"];
  await Promise.all(players.map((id, i) =>
    store.recordStreak({ userId: id, name: id.toUpperCase(), puzzleNumber: 1, now: i })));
  const top = await store.topStreaks();
  assert.deepEqual(top.map((e) => e.name).sort(), ["A", "B", "C", "D", "E"]);
});

test("a board saved before versioning existed can still be updated", async (t) => {
  // Production's board item has no version number yet.
  const { store, client, tableName } = await fresh(t);
  await client.send(new PutCommand({
    TableName: tableName,
    Item: { pk: "STATS", sk: "STREAKS", top: [{ userId: "old", name: "Old", maxStreak: 4, at: 1 }] },
  }));
  await store.recordStreak({ userId: "new", name: "New", puzzleNumber: 1, now: 2 });
  assert.deepEqual((await store.topStreaks()).map((e) => e.name), ["Old", "New"]);
});

test("solving the same day twice counts one solve", async (t) => {
  const { store } = await fresh(t);
  await store.markSolved({ date: DAY, userId: "u1", now: 1 });
  await store.markSolved({ date: DAY, userId: "u1", now: 2 });
  assert.equal((await store.globalStats(DAY)).todaySolved, 1);
});

test("two correct guesses from one player at the same moment count one solve", async (t) => {
  // A double click or a retried request: both guesses read "not solved yet"
  // before either one records the solve, so both used to count it.
  const { store } = await fresh(t);
  const config = { sessionSecret: "s", dailySecret: "d", discordClientId: "c", discordClientSecret: "x" };
  const api = createApi(store, config);
  const headers = { authorization: `Bearer ${createSessionToken({ id: "u1", username: "Steve" }, "s")}` };
  const body = { date: DAY, itemId: answerFor(DAY, "d").id };

  const results = await Promise.all([api.guess(body, headers), api.guess(body, headers)]);

  assert.deepEqual(results.map((r) => r.body.correct), [true, true]);
  const s = await store.globalStats(DAY);
  assert.equal(s.todaySolved, 1);
  assert.equal(s.played, 1);
  assert.equal(s.wins, 1);
  assert.equal((await store.leaderboard(DAY)).length, 1);
});
