/**
 * Email provider boundary. The job system is only coupled to this interface:
 * Sendgrid, Postmark, SMTP, etc. can replace Resend without touching the
 * worker, queue, or the API routes.
 */

export interface SendEmailInput {
  to: string;
  subject: string;
  body: string;
  /** Forwarded as the provider idempotency key so retries never send twice. */
  idempotencyKey?: string;
}

export interface SendEmailResult {
  /** Provider message id, if available. */
  id?: string;
}

export interface EmailProvider {
  readonly name: string;
  send(input: SendEmailInput): Promise<SendEmailResult>;
}