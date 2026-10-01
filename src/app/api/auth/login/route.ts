import { NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";
import { toPublicUser } from "@/lib/current-user";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body.username ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!username || !password) {
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }

    const user = await db.orm.public.User.where({ username }).first();
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }
    if (!user.active) {
      return NextResponse.json({ error: "inactive" }, { status: 403 });
    }

    const token = await createSessionToken({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
    });

    const response = NextResponse.json({ user: toPublicUser(user) });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json({ error: "login_failed" }, { status: 500 });
  }
}
