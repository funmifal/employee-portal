import { NextResponse } from "next/server";
import { requireApiEditor } from "@/lib/auth/api";
import { createUploadBatch } from "@/lib/uploads/service";

export const runtime = "nodejs";

export const maxDuration = 60;

export async function POST(request: Request) {
  const user = await requireApiEditor();
  if (user instanceof NextResponse) return user;

  try {
    const formData = await request.formData();
    const entries = formData.getAll("files");

    const files = await Promise.all(
      entries
        .filter((entry): entry is File => entry instanceof File)
        .map(async (file) => ({
          name: file.name,
          size: file.size,
          bytes: new Uint8Array(await file.arrayBuffer()),
        }))
    );

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided under field 'files'" }, { status: 400 });
    }

    const result = await createUploadBatch(user.id, files);

    return NextResponse.json(result, {
      status: result.acceptedCount > 0 ? 201 : 400,
    });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json({ error: "Failed to process upload" }, { status: 500 });
  }
}