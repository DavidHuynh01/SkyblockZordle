// The guess limit lives in one place (src/utils/game.js); everything that
// depends on it (the server's ranking cut-off, share text, stats rows) must
// follow it, so changing the limit can't leave a stray "8" behind.
import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_GUESSES, buildShareText } from "../../src/utils/game.js";
import { EMPTY } from "../../src/utils/stats.js";
import { ITEMS } from "../../src/data/items.js";
import { createDynamoStore } from "../store/dynamo.js";
import { createFakeClient } from "./fake-dynamo.js";

test("players get 10 guesses", () => {
  assert.equal(MAX_GUESSES, 10);
});

test("shared results are out of 10", () => {
  const row = { item: ITEMS[0], result: { rarity: { status: "correct" } } };
  assert.match(buildShareText([row], 1, false), /^SkyblockZordle #1 X\/10$/m);
  assert.match(buildShareText([row, row, row], 1, true), /^SkyblockZordle #1 3\/10$/m);
});

test("a player's stats have a row for every possible guess count", () => {
  assert.deepEqual(Object.keys(EMPTY.dist).map(Number), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});

test("global stats count wins on the 9th and 10th guess", async () => {
  const store = createDynamoStore({ client: createFakeClient(), tableName: "t" });
  await store.addScore({ name: "A", date: "2026-10-15", puzzleNumber: 1, guesses: 10, won: true,
    timeMs: 1, userId: "a", createdAt: 1 });
  const s = await store.globalStats("2026-10-15");
  assert.deepEqual(Object.keys(s.dist).map(Number), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(s.dist[10], 1);
});
