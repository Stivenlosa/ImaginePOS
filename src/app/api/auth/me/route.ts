import { NextResponse } from "next/server";
import { getActiveUser, toPublicUser } from "@/lib/current-user";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

export async function GET() {
  const user = await getActiveUser();
  if (!user) {
    const response = NextResponse.json({ error: "unauthorized" }, { status: 401 });
    response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
    return response;
  }

  return NextResponse.json({ user: toPublicUser(user) });
}
