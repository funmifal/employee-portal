import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { loginSchema } from "@/lib/validation/auth";
import { createUserSession } from "@/lib/auth/server";

export const runtime = "nodejs";

/**
 * Email-based session login. The user is looked up by email; if not found a
 * user with the default EDITOR role is created. No password is used: this is
 * the chosen secure-session equivalent for an internal tool. Production
 * deployments should wire this to an identity provider behind the same route.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email } = parsed.data;

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, role: "EDITOR" },
      select: { id: true, email: true, name: true, role: true },
    });

    await createUserSession(user.id);

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json({ error: "Failed to log in" }, { status: 500 });
  }
}