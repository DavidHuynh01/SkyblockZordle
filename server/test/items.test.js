// Guards on the item data itself: every puzzle must be solvable by deduction,
// and editing item stats must never reshuffle the daily answers.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ITEMS } from "../../src/data/items.js";
import { compareGuess, buildShareText } from "../../src/utils/game.js";
import { answerFor } from "../logic.js";

const COMPARED = ["rarity", "category", "damage", "strength", "source", "location", "tradeable"];
const byId = (id) => ITEMS.find((i) => i.id === id);

test("every item has damage and strength", () => {
  for (const it of ITEMS) {
    for (const stat of ["damage", "strength"]) {
      assert.ok(
        Number.isInteger(it[stat]) && it[stat] >= 0,
        `${it.name} has no ${stat} (run scripts/import-stats.mjs --write)`
      );
    }
  }
});

test("no three items look identical", () => {
  // Two identical items cost a player at most one guess: rule one out and the
  // other is certain. Three or more turns the puzzle into a coin toss.
  const groups = new Map();
  for (const it of ITEMS) {
    const key = COMPARED.map((k) => it[k]).join("|");
    groups.set(key, [...(groups.get(key) || []), it.name]);
  }
  for (const names of groups.values()) {
    assert.ok(names.length <= 2, `indistinguishable: ${names.join(", ")}`);
  }
});

test("item edits do not reshuffle the daily answers", () => {
  // The daily pick is by position in ITEMS (keyed by a secret in production,
  // a fixed test key here). Adding, removing or reordering items changes every
  // answer, including today's for anyone mid-game. If that is intended, ship it
  // right after UTC midnight and update this list.
  const pinned = {
    "2026-09-01": "mosquito_bow",
    "2026-09-02": "scylla",
    "2026-09-03": "hyperion",
    "2026-09-04": "jerry_chine_gun",
    "2026-09-05": "fel_sword",
    "2026-09-06": "zombie_soldier_cutlass",
    "2026-09-07": "sword_of_bad_health",
    "2026-09-08": "zombie_sword",
    "2026-09-09": "flower_of_truth",
    "2026-09-10": "magma_rod",
  };
  for (const [day, id] of Object.entries(pinned)) {
    assert.equal(answerFor(day, "pinned-test-secret").id, id, `the answer for ${day} moved`);
  }
});

test("damage and strength point towards the answer", () => {
  const r = compareGuess(byId("necrons_blade"), byId("hyperion"));
  assert.deepEqual(r.damage, { status: "correct", hint: null }, "both deal 260");
  assert.equal(r.strength.status, "wrong");
  assert.equal(r.strength.hint, "up", "Hyperion has more strength than Necron's Blade");
});

test("the old NPC Sell column is gone", () => {
  const r = compareGuess(ITEMS[0], ITEMS[1]);
  assert.deepEqual(Object.keys(r).sort(), [...COMPARED].sort());
});

test("sharing works for a guess saved before the new columns existed", () => {
  // Players mid-game when this ships have rows saved with the old columns.
  const old = { rarity: { status: "correct" }, category: { status: "correct" }, npcSell: { status: "wrong" },
    source: { status: "correct" }, location: { status: "wrong" }, tradeable: { status: "correct" } };
  const text = buildShareText([{ item: ITEMS[0], result: old }], 1, false);
  assert.match(text, /SkyblockZordle #1 X\/8/);
  assert.equal(text.split("\n")[1].length > 0, true);
});
