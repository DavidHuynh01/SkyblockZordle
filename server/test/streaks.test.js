import { test } from "node:test";
import assert from "node:assert/strict";
import { nextStreak, mergeTop } from "../streaks.js";

test("a first solve starts a streak of one", () => {
  const s = nextStreak(undefined, 10);
  assert.deepEqual(s, {
    streak: 1,
    maxStreak: 1,
    lastSolvedPuzzle: 10,
    changed: true,
    improved: true,
  });
});

test("solving the next puzzle extends the streak", () => {
  const s = nextStreak({ streak: 3, maxStreak: 3, lastSolvedPuzzle: 10 }, 11);
  assert.equal(s.streak, 4);
  assert.equal(s.maxStreak, 4);
  assert.equal(s.improved, true);
});

test("a skipped puzzle resets the streak but keeps the record", () => {
  const s = nextStreak({ streak: 5, maxStreak: 5, lastSolvedPuzzle: 10 }, 13);
  assert.equal(s.streak, 1, "a missed day breaks the run");
  assert.equal(s.maxStreak, 5, "the personal best must never go down");
  assert.equal(s.improved, false);
});

test("re-solving the same puzzle changes nothing", () => {
  const prev = { streak: 3, maxStreak: 7, lastSolvedPuzzle: 10 };
  const s = nextStreak(prev, 10);
  assert.equal(s.changed, false);
  assert.equal(s.streak, 3);
  assert.equal(s.maxStreak, 7);
});

test("solving an older puzzle cannot move the streak backwards", () => {
  // A client can put any date in a guess, so the streak must only ever walk
  // forward — otherwise replaying an old day would reset your own run.
  const s = nextStreak({ streak: 4, maxStreak: 4, lastSolvedPuzzle: 10 }, 6);
  assert.equal(s.changed, false);
  assert.equal(s.streak, 4);
  assert.equal(s.lastSolvedPuzzle, 10);
});

test("mergeTop ranks by streak, longest first", () => {
  const list = mergeTop([], { userId: "a", name: "A", maxStreak: 2, at: 1 });
  const out = mergeTop(list, { userId: "b", name: "B", maxStreak: 5, at: 2 });
  assert.deepEqual(out.map((e) => e.userId), ["b", "a"]);
});

test("mergeTop keeps one row per player, with their best", () => {
  let list = mergeTop([], { userId: "a", name: "A", maxStreak: 2, at: 1 });
  list = mergeTop(list, { userId: "a", name: "A", maxStreak: 6, at: 2 });
  assert.equal(list.length, 1);
  assert.equal(list[0].maxStreak, 6);
});

test("mergeTop breaks ties in favour of whoever got there first", () => {
  let list = mergeTop([], { userId: "a", name: "A", maxStreak: 3, at: 100 });
  list = mergeTop(list, { userId: "b", name: "B", maxStreak: 3, at: 50 });
  assert.deepEqual(list.map((e) => e.userId), ["b", "a"]);
});

test("mergeTop caps the list", () => {
  let list = [];
  for (let i = 0; i < 15; i++) {
    list = mergeTop(list, { userId: `u${i}`, name: `U${i}`, maxStreak: i, at: i }, 10);
  }
  assert.equal(list.length, 10);
  assert.equal(list[0].maxStreak, 14, "the longest streak stays at the top");
  assert.equal(list[9].maxStreak, 5, "the shortest ones fall off");
});
