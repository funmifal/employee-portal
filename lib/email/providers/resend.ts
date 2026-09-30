import { EmailProvider, SendEmailInput, SendEmailResult } from "../types";

/**
 * Resend provider. Talks to the Resend REST API.
 *
 * The job's idempotencyKey is passed as Resend's `Idempotency-Key` header so
 * a worker retry of the same job cannot produce a duplicate email.
 */
export class ResendEmailProvider implements EmailProvider {
  readonly name = "resend";

  private apiKey: string;
  private from: string;
  private baseUrl = "https://api.resend.com/emails";

  constructor(apiKey: string, from: string) {
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is required to use the Resend email provider");
    }
    this.apiKey = apiKey;
    this.from = from;
  }

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
    if (input.idempotencyKey) {
      headers["Idempotency-Key"] = input.idempotencyKey;
    }

    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        from: this.from,
        to: [input.to],
        subject: input.subject,
        text: input.body,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Resend API error ${res.status}: ${detail.slice(0, 500)}`);
    }

    const data = (await res.json()) as { id: string };
    return { id: data.id };
  }
}