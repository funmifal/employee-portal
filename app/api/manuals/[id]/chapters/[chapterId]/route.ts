import { NextResponse } from "next/server";
import { requireApiEditor } from "@/lib/auth/api";
import { updateChapter, ManualAccessError } from "@/lib/manuals/service";
import { updateChapterSchema } from "@/lib/validation/manual";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string; chapterId: string }> }
) {
  const user = await requireApiEditor();
  if (user instanceof NextResponse) return user;

  const params = await props.params;
  const { chapterId } = params;

  try {
    const body = await request.json();
    const parsed = updateChapterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const chapter = await updateChapter(chapterId, parsed.data, user);
    return NextResponse.json({ chapter });
  } catch (error) {
    if (error instanceof ManualAccessError) {
      const status = error.message === "NOT_FOUND" ? 404 : 403;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "Failed to update chapter" }, { status: 500 });
  }
}