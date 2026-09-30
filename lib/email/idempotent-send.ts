import { EmailProvider, SendEmailInput } from "./types";

/**
 * Where one job's output lives. Keyed by job id: before a job re-runs its work
 * it asks this store whether an output already exists. A worker that crashed
 * after doing the work but before marking the job SUCCEEDED will then skip the
 * work instead of repeating it (double email, double charge, ...).
 */
export interface JobOutputStore {
  find(jobId: string): Promise<Record<string, unknown> | null>;
  create(
    jobId: string,
    type: string,
    payload: Record<string, unknown>
  ): Promise<{ existed: boolean; payload: Record<string, unknown> }>;
}

export interface SendEmailIdempotentlyParams {
  jobId: string;
  input: SendEmailInput;
  provider: EmailProvider;
  store: JobOutputStore;
}

export interface IdempotentSendResult {
  success: boolean;
  output: Record<string, unknown>;
  reused: boolean;
  error?: string;
}

/**
 * Send an email at most once per job.
 *
 * 1. If an output for this job id already exists, return it — the job has
 *    already been run to success, so we must not send again.
 * 2. Otherwise perform the send, then record the output keyed by job id.
 *
 * Two workers racing here (only possible after a stuck-recovery re-claim) both
 * fall through to step 2; the provider-level `Idempotency-Key` (forwarded in
 * `input.idempotencyKey`) collapses the duplicate sends into a single message,
 * and whichever `store.create` lands second sees the row already exists.
 */
export async function sendEmailIdempotently(
  params: SendEmailIdempotentlyParams
): Promise<IdempotentSendResult> {
  const existing = await params.store.find(params.jobId);
  if (existing) {
    return { success: true, output: existing, reused: true };
  }

  try {
    const result = await params.provider.send(params.input);

    const output = {
      to: params.input.to,
      subject: params.input.subject,
      providerName: params.provider.name,
      messageId: result.id,
      sentAt: new Date().toISOString(),
    };

    const saved = await params.store.create(params.jobId, "email-send", output);

    return {
      success: true,
      output: saved.payload,
      reused: saved.existed,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, output: {}, reused: false, error: message };
  }
}