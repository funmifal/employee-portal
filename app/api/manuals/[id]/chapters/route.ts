import { NextResponse } from "next/server";
import { requireApiEditor } from "@/lib/auth/api";
import { createChapter, ManualAccessError } from "@/lib/manuals/service";
import { createChapterSchema } from "@/lib/validation/manual";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const user = await requireApiEditor();
  if (user instanceof NextResponse) return user;

  const { id } = await props.params;

  try {
    const body = await request.json();
    const parsed = createChapterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const chapter = await createChapter(id, parsed.data, user);
    return NextResponse.json({ chapter }, { status: 201 });
  } catch (error) {
    if (error instanceof ManualAccessError) {
      const status = error.message === "NOT_FOUND" ? 404 : 403;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "Failed to create chapter" }, { status: 500 });
  }
}