import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/current-user";
import { readRegisterSessionIdFromCookie } from "@/lib/register-session";
import {
  REGISTER_SESSION_COOKIE,
  registerSessionCookieOptions,
} from "@/lib/register-session-cookie";
import {
  closeRegisterSession,
  getRegisterSessionById,
  liveSessionSummary,
  serializeRegisterSession,
} from "@/lib/register-store";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.status === 401 ? "unauthorized" : "forbidden" }, { status: auth.status });
  }

  const body = (await request.json()) as { sessionId?: number; countedCash?: number };
  const cookieSessionId = await readRegisterSessionIdFromCookie();
  const sessionId = body.sessionId ?? cookieSessionId;

  if (typeof sessionId !== "number" || typeof body.countedCash !== "number" || body.countedCash < 0) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  try {
    await closeRegisterSession({
      sessionId,
      closedByUserId: auth.user.id,
      countedCash: body.countedCash,
    });

    const session = await getRegisterSessionById(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const response = NextResponse.json({
      session: serializeRegisterSession(session),
    });

    if (cookieSessionId === sessionId) {
      response.cookies.set(REGISTER_SESSION_COOKIE, "", { ...registerSessionCookieOptions(), maxAge: 0 });
    }

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    if (message === "SESSION_NOT_FOUND") {
      return NextResponse.json({ error: "Register session not found" }, { status: 404 });
    }
    if (message === "SESSION_ALREADY_CLOSED") {
      return NextResponse.json({ error: "Register session is already closed" }, { status: 409 });
    }
    console.error("Close register session failed:", error);
    return NextResponse.json({ error: "Could not close register session" }, { status: 500 });
  }
}

export async function GET() {
  const sessionId = await readRegisterSessionIdFromCookie();
  if (!sessionId) {
    return NextResponse.json({ error: "No register session on this terminal" }, { status: 404 });
  }

  const session = await getRegisterSessionById(sessionId);
  if (!session || session.status !== "open") {
    return NextResponse.json({ error: "Register session is not open" }, { status: 409 });
  }

  const summary = await liveSessionSummary(sessionId);
  return NextResponse.json({
    session: serializeRegisterSession(session, summary ?? undefined),
  });
}
