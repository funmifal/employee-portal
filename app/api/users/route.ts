import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/api";
import { listUsers, UserAccessError } from "@/lib/users/service";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof NextResponse) return user;

  try {
    const users = await listUsers(user);
    return NextResponse.json({ users });
  } catch (error) {
    if (error instanceof UserAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to list users" }, { status: 500 });
  }
}