// Pure frontend modules that are worth guarding in CI: the volume curve, and
// the update log (so a malformed entry can never ship).
import { test } from "node:test";
import assert from "node:assert/strict";
import { toGain, clampPercent, DEFAULTS } from "../../src/utils/sound.js";
import { CHANGELOG, CURRENT_VERSION } from "../../src/data/changelog.js";

test("volume 0 is silent and 100 is full", () => {
  assert.equal(toGain(0), 0);
  assert.equal(toGain(100), 1);
});

test("the volume curve is perceptual, not linear", () => {
  // Loudness is heard logarithmically; a linear slider puts all the useful
  // range in the bottom fifth. Squaring spreads it across the slider.
  assert.equal(toGain(50), 0.25);
  assert.ok(toGain(25) < 0.25 / 2, "the low end should be gentle");
});

test("out-of-range and junk volumes are clamped", () => {
  assert.equal(clampPercent(-20), 0);
  assert.equal(clampPercent(250), 100);
  assert.equal(clampPercent("abc"), DEFAULTS.music);
  assert.equal(clampPercent(undefined, 70), 70);
  assert.equal(clampPercent(42.6), 43);
});

test("music starts quieter than sound effects by default", () => {
  assert.ok(DEFAULTS.music < DEFAULTS.sfx);
  assert.equal(DEFAULTS.muted, false);
});

test("every update log entry is complete", () => {
  assert.ok(CHANGELOG.length > 0);
  for (const e of CHANGELOG) {
    assert.match(e.version, /^\d+\.\d+$/, `bad version "${e.version}"`);
    assert.match(e.date, /^\d{4}-\d{2}-\d{2}$/, `bad date on ${e.version}`);
    assert.ok(e.title?.trim(), `${e.version} needs a title`);
    assert.ok(Array.isArray(e.changes) && e.changes.length, `${e.version} lists no changes`);
    for (const c of e.changes) assert.ok(typeof c === "string" && c.trim(), `empty change in ${e.version}`);
  }
});

test("update log versions are unique and newest first", () => {
  const nums = CHANGELOG.map((e) => e.version.split(".").map(Number));
  for (let i = 1; i < nums.length; i++) {
    const [aMaj, aMin] = nums[i - 1];
    const [bMaj, bMin] = nums[i];
    assert.ok(
      aMaj > bMaj || (aMaj === bMaj && aMin > bMin),
      `${CHANGELOG[i - 1].version} must be newer than ${CHANGELOG[i].version}`
    );
  }
  const dates = CHANGELOG.map((e) => e.date);
  assert.deepEqual([...dates].sort().reverse(), dates, "dates must not go backwards");
});

test("the current version is the newest entry", () => {
  assert.equal(CURRENT_VERSION, CHANGELOG[0].version);
});
