import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/api";
import { updateUserRole, UserAccessError } from "@/lib/users/service";
import { updateUserRoleSchema } from "@/lib/validation/auth";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const actor = await requireApiAdmin();
  if (actor instanceof NextResponse) return actor;

  const { id } = await props.params;

  try {
    const body = await request.json();
    const parsed = updateUserRoleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const user = await updateUserRole(id, parsed.data.role, actor);
    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof UserAccessError) {
      const status =
        error.message === "NOT_FOUND" ? 404 : error.message === "SELF_DOWNGRADE" ? 400 : 403;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
  }
}