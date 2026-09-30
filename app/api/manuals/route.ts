import { NextResponse } from "next/server";
import { requireApiEditor, requireApiViewer } from "@/lib/auth/api";
import { createManual, listManuals, ManualAccessError } from "@/lib/manuals/service";
import { createManualSchema } from "@/lib/validation/manual";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireApiViewer();
  if (user instanceof NextResponse) return user;

  try {
    const manuals = await listManuals(user);
    return NextResponse.json({ manuals });
  } catch (error) {
    console.error("List manuals failed:", error);
    return NextResponse.json({ error: "Failed to list manuals" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await requireApiEditor();
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();
    const parsed = createManualSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const manual = await createManual({ ...parsed.data, user });
    return NextResponse.json({ manual }, { status: 201 });
  } catch (error) {
    if (error instanceof ManualAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Create manual failed:", error);
    return NextResponse.json({ error: "Failed to create manual" }, { status: 500 });
  }
}