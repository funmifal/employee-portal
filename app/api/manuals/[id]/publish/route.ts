import { NextResponse } from "next/server";
import { requireApiPublisher } from "@/lib/auth/api";
import { publishManual, ManualAccessError } from "@/lib/manuals/service";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPublisher();
  if (user instanceof NextResponse) return user;

  const { id } = await props.params;

  try {
    const manual = await publishManual(id, user);
    return NextResponse.json({ manual });
  } catch (error) {
    if (error instanceof ManualAccessError) {
      const status = error.message === "NOT_FOUND" ? 404 : 403;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "Failed to publish manual" }, { status: 500 });
  }
}