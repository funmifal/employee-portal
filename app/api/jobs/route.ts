import { enqueueJob } from "@/lib/processing/queue";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, payload, idempotencyKey, maxAttempts } = body;

    if (!type) {
      return NextResponse.json(
        { error: "Job type is required" },
        { status: 400 }
      );
    }

    const job = await enqueueJob({
      type,
      payload: payload || {},
      idempotencyKey,
      maxAttempts: maxAttempts ? Number(maxAttempts) : 3,
    });

    return NextResponse.json(
      {
        id: job.id,
        type: job.type,
        status: job.status,
        idempotencyKey: job.idempotencyKey,
        createdAt: job.createdAt,
      },
      { status: 202 }
    );
  } catch (error) {
    console.error("Error enqueuing job:", error);
    return NextResponse.json(
      { error: "Failed to enqueue job" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}
