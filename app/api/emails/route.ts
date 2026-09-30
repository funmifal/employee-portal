import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth/server";
import { sendEmailSchema } from "@/lib/email/validation";
import { enqueueEmailSend } from "@/jobs/email-send/handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Minimal email trigger API — deliberately unauthenticated, per the demo
 * scope ("no authentication beyond identifying a user"). The submitter is
 * recorded from the session when one exists.
 * POST -> enqueue an "email-send" job (202) and return immediately.
 * GET  -> list recent email-send jobs (the status view's data source).
 */
async function identifySubmitter(): Promise<string> {
  const user = await getSessionUser();
  return user?.email ?? "local-dev";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = sendEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { to, subject, body: content, shouldFail } = parsed.data;

  const job = await enqueueEmailSend({
    to,
    subject,
    body: content,
    requestedBy: await identifySubmitter(),
    shouldFail,
    idempotencyKey: parsed.data.idempotencyKey,
  });

  return NextResponse.json(
    {
      job: {
        id: job.id,
        type: job.type,
        status: job.status,
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
        createdAt: job.createdAt,
      },
    },
    { status: 202 }
  );
}

export async function GET() {
  const jobs = await prisma.job.findMany({
    where: { type: "email-send" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ jobs });
}