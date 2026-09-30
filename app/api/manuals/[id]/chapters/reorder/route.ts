import { NextResponse } from "next/server";
import { requireApiEditor } from "@/lib/auth/api";
import { reorderChapters, ManualAccessError } from "@/lib/manuals/service";
import { reorderChaptersSchema } from "@/lib/validation/manual";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const user = await requireApiEditor();
  if (user instanceof NextResponse) return user;

  const { id } = await props.params;

  try {
    const body = await request.json();
    const parsed = reorderChaptersSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const chapters = await reorderChapters(id, parsed.data.orderedChapterIds, user);
    return NextResponse.json({ chapters });
  } catch (error) {
    if (error instanceof ManualAccessError) {
      const status = error.message === "NOT_FOUND" ? 404 : 403;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "Failed to reorder chapters" }, { status: 500 });
  }
}