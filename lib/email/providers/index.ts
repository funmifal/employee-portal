import "server-only";

import { EmailProvider } from "../types";
import { ResendEmailProvider } from "./resend";

let provider: EmailProvider | null = null;

/**
 * Singleton email provider selected by EMAIL_PROVIDER ("resend" being the
 * only real implementation so far).
 */
export function getEmailProvider(): EmailProvider {
  if (provider) return provider;

  const name = process.env.EMAIL_PROVIDER ?? "resend";

  switch (name) {
    case "resend":
      provider = new ResendEmailProvider(
        process.env.RESEND_API_KEY ?? "",
        process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev"
      );
      break;
    default:
      throw new Error(
        `Unsupported EMAIL_PROVIDER: ${name}. Configure one or use "resend".`
      );
  }
  return provider;
}