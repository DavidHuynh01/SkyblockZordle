import { test } from "node:test";
import assert from "node:assert/strict";
import { createRateLimiter } from "../ratelimit.js";

function clock(start = 0) {
  let t = start;
  return { now: () => t, advance: (ms) => (t += ms) };
}

test("allows traffic under the limit", () => {
  const rl = createRateLimiter({ limits: { read: 3, write: 2 } });
  for (let i = 0; i < 3; i++) assert.equal(rl.check("1.1.1.1").allowed, true);
});

test("blocks once the limit is passed, with a retry hint", () => {
  const rl = createRateLimiter({ limits: { read: 3, write: 2 } });
  for (let i = 0; i < 3; i++) rl.check("1.1.1.1");
  const res = rl.check("1.1.1.1");
  assert.equal(res.allowed, false);
  assert.ok(res.retryAfter > 0 && res.retryAfter <= 60);
});

test("the window resets", () => {
  const c = clock();
  const rl = createRateLimiter({ now: c.now, limits: { read: 2, write: 2 } });
  rl.check("1.1.1.1"); rl.check("1.1.1.1");
  assert.equal(rl.check("1.1.1.1").allowed, false);
  c.advance(60_001);
  assert.equal(rl.check("1.1.1.1").allowed, true, "a new minute starts fresh");
});

test("one IP flooding does not block another", () => {
  const rl = createRateLimiter({ limits: { read: 2, write: 2 } });
  rl.check("1.1.1.1"); rl.check("1.1.1.1"); rl.check("1.1.1.1");
  assert.equal(rl.check("2.2.2.2").allowed, true);
});

test("writes are limited separately from reads", () => {
  const rl = createRateLimiter({ limits: { read: 5, write: 1 } });
  assert.equal(rl.check("1.1.1.1", "write").allowed, true);
  assert.equal(rl.check("1.1.1.1", "write").allowed, false, "write budget spent");
  assert.equal(rl.check("1.1.1.1", "read").allowed, true, "reads still fine");
});

test("memory is bounded", () => {
  const rl = createRateLimiter({ limits: { read: 100, write: 100 } });
  for (let i = 0; i < 6000; i++) rl.check(`10.0.${i % 255}.${i % 97}`);
  assert.ok(rl.size() <= 5001, `tracked ${rl.size()} buckets`);
});

test("a missing IP is allowed rather than crashing", () => {
  const rl = createRateLimiter();
  assert.equal(rl.check(undefined).allowed, true);
});
