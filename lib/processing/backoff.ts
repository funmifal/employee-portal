/**
 * Exponential backoff with jitter, pure and testable.
 *
 * delay = baseBackoffMs * 2^(attempts) + randomOffset
 *
 * The exponent uses attempts (the number of completed attempts, >= 1), so a
 * job failing for the first time backs off by 2x base, then 4x, 8x, ... The
 * additive random offset de-synchronizes jobs that failed at the same moment —
 * without jitter, a batch that hit a failing dependency together would retry
 * at the same moment and re-hit it together.
 */
export interface RetryDelayInput {
  baseBackoffMs: number;
  /** Completed attempts (>= 1). Controls the exponential growth. */
  attempts: number;
  /** Upper bound (exclusive) of the uniform random offset in ms. */
  jitterMaxMs: number;
}

export function computeRetryDelayMs(
  input: RetryDelayInput,
  rand: () => number = Math.random
): number {
  if (!Number.isFinite(input.baseBackoffMs) || input.baseBackoffMs <= 0) {
    throw new RangeError("baseBackoffMs must be a positive number");
  }
  if (!Number.isInteger(input.attempts) || input.attempts < 1) {
    throw new RangeError("attempts must be an integer >= 1");
  }
  if (!Number.isFinite(input.jitterMaxMs) || input.jitterMaxMs < 0) {
    throw new RangeError("jitterMaxMs must be >= 0");
  }

  const exponential = input.baseBackoffMs * Math.pow(2, input.attempts);
  const jitter = Math.floor(rand() * input.jitterMaxMs);
  return exponential + jitter;
}