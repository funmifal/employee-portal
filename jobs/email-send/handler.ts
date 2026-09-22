import "server-only";

import { createHash } from "node:crypto";
import { getEmailProvider } from "@/lib/email/providers";
import { sendEmailIdempotently } from "@/lib/email/idempotent-send";
import { enqueueJob } from "@/lib/processing/queue";
import { prismaJobOutputStore } from "@/lib/processing/output";
import { assertEmailSendPayload } from "@/lib/email/validation";
import type { JobHandlerResult } from "@/lib/processing/worker";

/**
 * Stable idempotency key for a logical email. Two identical submissions
 * (same to + subject + body) produce the same key, so enqueueing twice
 * returns the existing job instead of a second row. A caller-supplied key
 * overrides the derivation.
 */
export function emailIdempotencyKey(input: {
  to: string;
  subject: string;
  body: string;
  explicitKey?: string;
}): string {
  if (input.explicitKey) return input.explicitKey;
  const logical = `${input.to}\u0000${input.subject}\u0000${input.body}`;
  return `email-send:${createHash("sha256").update(logical).digest("hex")}`;
}

export interface EmailSendJobPayload {
  to: string;
  subject: string;
  body: string;
  requestedBy: string;
  shouldFail?: boolean;
}

/**
 * Handler for "email-send" jobs. Performs the real slow work — a call to the
 * Resend API — fully off the request path.
 *
 * IDEMPOTENT EXECUTION: the job id keys the output row (JobOutput). Before
 * sending we check whether this job already produced an output and, if so,
 * return it without calling the provider. That makes a second run of the same
 * job safe: a worker that crashed after Resend accepted the message but before
 * the job was marked SUCCEEDED will not send a duplicate. The job's
 * idempotencyKey is also forwarded as the provider's Idempotency-Key to
 * collapse the narrow crash window at the API itself.
 */
export async function handleEmailSend(
  rawPayload: unknown,
  jobId: string,
  idempotencyKey?: string | null
): Promise<JobHandlerResult> {
  const payload = assertEmailSendPayload(rawPayload);

  if (payload.shouldFail) {
    throw new Error("Simulated email failure (shouldFail=true)");
  }

  const result = await sendEmailIdempotently({
    jobId,
    input: {
      to: payload.to,
      subject: payload.subject,
      body: payload.body,
      idempotencyKey: idempotencyKey ?? undefined,
    },
    provider: getEmailProvider(),
    store: prismaJobOutputStore,
  });

  if (!result.success) {
    throw new Error(result.error ?? "Email send failed");
  }

  return {
    success: true,
    output: { ...result.output, reused: result.reused },
  };
}

export async function enqueueEmailSend(input: {
  to: string;
  subject: string;
  body: string;
  requestedBy: string;
  shouldFail?: boolean;
  /** Optional caller-supplied idempotency key; defaults to a content hash. */
  idempotencyKey?: string;
}) {
  const payload: Record<string, unknown> = {
    to: input.to,
    subject: input.subject,
    body: input.body,
    requestedBy: input.requestedBy,
  };
  if (input.shouldFail) payload.shouldFail = true;

  return enqueueJob({
    type: "email-send",
    payload,
    // Same logical email -> same key -> the queue returns the existing job.
    idempotencyKey: emailIdempotencyKey({
      to: input.to,
      subject: input.subject,
      body: input.body,
      explicitKey: input.idempotencyKey,
    }),
  });
}