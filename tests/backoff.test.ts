import { test } from "node:test";
import assert from "node:assert/strict";
import { computeRetryDelayMs } from "../lib/processing/backoff";

test("backoff is exponential in completed attempts", () => {
  const fixed = () => 0;
  assert.equal(
    computeRetryDelayMs({ baseBackoffMs: 1000, attempts: 1, jitterMaxMs: 500 }, fixed),
    1000 * Math.pow(2, 1)
  );
  assert.equal(
    computeRetryDelayMs({ baseBackoffMs: 1000, attempts: 2, jitterMaxMs: 500 }, fixed),
    1000 * Math.pow(2, 2)
  );
  assert.equal(
    computeRetryDelayMs({ baseBackoffMs: 1000, attempts: 3, jitterMaxMs: 500 }, fixed),
    1000 * Math.pow(2, 3)
  );
});

test("jitter adds a random offset within [0, jitterMaxMs)", () => {
  const jitterMaxMs = 500;
  for (let i = 0; i < 50; i++) {
    const rand = Math.random;
    const delay = computeRetryDelayMs(
      { baseBackoffMs: 1000, attempts: 1, jitterMaxMs },
      rand
    );
    assert.ok(delay >= 1000 * 2, `delay ${delay} must not drop below the exponential term`);
    assert.ok(delay < 1000 * 2 + jitterMaxMs, `delay ${delay} must be below exponential + jitterMaxMs`);
  }
});

test("jitterMaxMs of zero disables the random offset", () => {
  const delay = computeRetryDelayMs(
    { baseBackoffMs: 250, attempts: 2, jitterMaxMs: 0 },
    () => 0.999 // would add 499ms if jitter were enabled
  );
  assert.equal(delay, 250 * 4);
});

test("injects the RNG for deterministic sampling", () => {
  const rand = () => 0.5;
  const delay = computeRetryDelayMs({ baseBackoffMs: 1000, attempts: 2, jitterMaxMs: 100 }, rand);
  assert.equal(delay, 1000 * 4 + Math.floor(0.5 * 100));
});

test("rejects invalid inputs", () => {
  const input = { baseBackoffMs: 1000, attempts: 1, jitterMaxMs: 500 };
  assert.throws(() => computeRetryDelayMs({ ...input, baseBackoffMs: 0 }));
  assert.throws(() => computeRetryDelayMs({ ...input, baseBackoffMs: -5 }));
  assert.throws(() => computeRetryDelayMs({ ...input, attempts: 0 }));
  assert.throws(() => computeRetryDelayMs({ ...input, attempts: 1.5 }));
  assert.throws(() => computeRetryDelayMs({ ...input, jitterMaxMs: -1 }));
});

test("simulates a batch that failed together retrying at staggered times", () => {
  const baseBackoffMs = 1000;
  const attempts = 1;
  const delays = new Set<number>();
  for (let i = 0; i < 8; i++) {
    delays.add(
      computeRetryDelayMs({ baseBackoffMs, attempts, jitterMaxMs: 500 }, Math.random)
    );
  }
  assert.ok(delays.size > 1, "identical jobs must not retry at the exact same time");
});