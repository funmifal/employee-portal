import { NextResponse } from "next/server";
import { requireApiEditor, requireApiViewer } from "@/lib/auth/api";
import { getManual, updateManual, ManualAccessError } from "@/lib/manuals/service";
import { updateManualSchema } from "@/lib/validation/manual";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const user = await requireApiViewer();
  if (user instanceof NextResponse) return user;

  const { id } = await props.params;

  try {
    const manual = await getManual(id, user);
    if (!manual) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ manual });
  } catch (error) {
    if (error instanceof ManualAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to load manual" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const user = await requireApiEditor();
  if (user instanceof NextResponse) return user;

  const { id } = await props.params;

  try {
    const body = await request.json();
    const parsed = updateManualSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const manual = await updateManual(id, parsed.data, user);
    return NextResponse.json({ manual });
  } catch (error) {
    if (error instanceof ManualAccessError) {
      const status = error.message === "NOT_FOUND" ? 404 : 403;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "Failed to update manual" }, { status: 500 });
  }
}