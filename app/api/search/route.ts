import { NextResponse } from "next/server";
import { requireApiViewer } from "@/lib/auth/api";
import { searchManualChapters } from "@/lib/search";
import { searchQuerySchema } from "@/lib/validation/manual";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await requireApiViewer();
  if (user instanceof NextResponse) return user;

  const url = new URL(request.url);
  const rawQuery = url.searchParams.get("q") ?? "";

  const parsed = searchQuerySchema.safeParse({ q: rawQuery });
  if (!parsed.success) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  try {
    const results = await searchManualChapters(parsed.data.q, user);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search failed:", error);
    return NextResponse.json(
      { error: "Semantic search is unavailable. Verify pgvector is enabled." },
      { status: 500 }
    );
  }
}