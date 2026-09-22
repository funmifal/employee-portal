import { z } from "zod";

export const sendEmailSchema = z.object({
  to: z.string().trim().email().max(320),
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().max(50_000).optional().default(""),
  shouldFail: z.boolean().optional(),
  idempotencyKey: z.string().trim().max(255).optional(),
});

export type SendEmailInput = z.infer<typeof sendEmailSchema>;

export interface EmailSendPayload {
  to: string;
  subject: string;
  body: string;
  requestedBy: string;
  /** Dev/testing flag: forces the send to throw so retries/DEAD are exercisable. */
  shouldFail?: boolean;
}

/** Throws when a job payload is missing required fields (untrusted DB input). */
export function assertEmailSendPayload(payload: unknown): EmailSendPayload {
  const p = (payload ?? {}) as EmailSendPayload;
  if (typeof p.to !== "string" || !p.to) {
    throw new Error("EmailSend job payload is missing 'to'");
  }
  if (typeof p.subject !== "string" || !p.subject) {
    throw new Error("EmailSend job payload is missing 'subject'");
  }
  return {
    to: p.to,
    subject: p.subject,
    body: typeof p.body === "string" ? p.body : "",
    requestedBy: typeof p.requestedBy === "string" ? p.requestedBy : "unknown",
    shouldFail: p.shouldFail === true,
  };
}