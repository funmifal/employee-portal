/**
 * Job lifecycle helpers shared by the worker, the status endpoint and the
 * polling clients. Terminal statuses mean the worker will never touch the row
 * again on its own; active statuses mean it still might.
 */

export const ACTIVE_JOB_STATUSES = ["PENDING", "PROCESSING", "FAILED"] as const;
export const TERMINAL_JOB_STATUSES = ["SUCCEEDED", "DEAD"] as const;

export function isTerminalJobStatus(status: string | null | undefined): boolean {
  return (TERMINAL_JOB_STATUSES as readonly string[]).includes(status ?? "");
}

/**
 * Anything we do not recognize as a terminal status is treated as active: a
 * poller must never stop just because it saw an unexpected value.
 */
export function isActiveJobStatus(status: string | null | undefined): boolean {
  return !isTerminalJobStatus(status);
}