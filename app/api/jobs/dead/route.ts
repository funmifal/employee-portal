import { listDeadJobs } from "@/lib/processing/dead-letters";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const deadJobs = await listDeadJobs();
    return NextResponse.json({ deadJobs });
  } catch (error) {
    console.error("Error fetching dead letters:", error);
    return NextResponse.json(
      { error: "Failed to fetch dead letters" },
      { status: 500 }
    );
  }
}