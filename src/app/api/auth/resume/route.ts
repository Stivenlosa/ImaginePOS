import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { RESUME_COOKIE, SESSION_COOKIE, sessionCookieOptions, verifySessionToken } from "@/lib/session";

/** Restores a full session cookie after a refresh cancelled a pending close. */
export async function POST(request: Request) {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!(await verifySessionToken(token)) || !token) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let t = Date.now();
  try {
    const body = (await request.json()) as { t?: unknown };
    const parsed = Number(body?.t);
    if (Number.isFinite(parsed) && parsed > 0) t = parsed;
  } catch {
    // Beacon-less resume still records "now"
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  response.cookies.set(RESUME_COOKIE, String(t), {
    ...sessionCookieOptions(),
    maxAge: 60,
  });
  return response;
}
