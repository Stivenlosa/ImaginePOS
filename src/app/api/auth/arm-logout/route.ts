import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { RESUME_COOKIE, SESSION_COOKIE, sessionCookieOptions, verifySessionToken } from "@/lib/session";

/** How long the session survives after the last window closes, so a refresh can cancel it. */
const ARM_MAX_AGE_SECONDS = 10;

/**
 * Called when the last app window is closing. Shortens the session cookie so it
 * dies almost immediately, unless a refresh resumes it with a newer timestamp.
 */
export async function POST(request: Request) {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!(await verifySessionToken(token)) || !token) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let t = 0;
  try {
    const body = (await request.json()) as { t?: unknown };
    t = Number(body?.t);
  } catch {
    t = 0;
  }

  const resumeAt = Number(jar.get(RESUME_COOKIE)?.value ?? 0);
  if (Number.isFinite(t) && t > 0 && resumeAt >= t) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(ARM_MAX_AGE_SECONDS));
  return response;
}
