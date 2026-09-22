import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isActiveJobStatus,
  isTerminalJobStatus,
  ACTIVE_JOB_STATUSES,
  TERMINAL_JOB_STATUSES,
} from "../lib/processing/job-status";

test("terminal statuses are SUCCEEDED and DEAD", () => {
  assert.deepEqual([...TERMINAL_JOB_STATUSES], ["SUCCEEDED", "DEAD"]);
  assert.equal(isTerminalJobStatus("SUCCEEDED"), true);
  assert.equal(isTerminalJobStatus("DEAD"), true);
});

test("active statuses keep polling", () => {
  assert.deepEqual([...ACTIVE_JOB_STATUSES], ["PENDING", "PROCESSING", "FAILED"]);
  for (const s of ACTIVE_JOB_STATUSES) {
    assert.equal(isActiveJobStatus(s), true, `${s} should be active`);
    assert.equal(isTerminalJobStatus(s), false, `${s} should not be terminal`);
  }
});

test("unknown or missing status is treated as active (keeps polling)", () => {
  assert.equal(isActiveJobStatus(null), true);
  assert.equal(isActiveJobStatus(undefined), true);
  assert.equal(isActiveJobStatus("UNKNOWN"), true);
  assert.equal(isTerminalJobStatus("UNKNOWN"), false);
});