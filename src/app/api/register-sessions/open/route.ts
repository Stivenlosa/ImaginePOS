import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/current-user";
import {
  createRegisterSessionToken,
  registerSessionCookieOptions,
  REGISTER_SESSION_COOKIE,
} from "@/lib/register-session-cookie";
import {
  getRegisterSessionById,
  openRegisterSession,
  serializeRegisterSession,
} from "@/lib/register-store";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.status === 401 ? "unauthorized" : "forbidden" }, { status: auth.status });
  }

  const body = (await request.json()) as {
    registerId?: number;
    cashierUserId?: number;
    openingFloat?: number;
  };

  if (
    typeof body.registerId !== "number" ||
    typeof body.cashierUserId !== "number" ||
    typeof body.openingFloat !== "number" ||
    body.openingFloat < 0
  ) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  try {
    const created = await openRegisterSession({
      registerId: body.registerId,
      cashierUserId: body.cashierUserId,
      openedByUserId: auth.user.id,
      openingFloat: body.openingFloat,
    });

    const session = await getRegisterSessionById(created.id);
    if (!session) {
      return NextResponse.json({ error: "Session not found after open" }, { status: 500 });
    }

    const token = await createRegisterSessionToken(session.id);
    const response = NextResponse.json(
      { session: serializeRegisterSession(session) },
      { status: 201 },
    );
    response.cookies.set(REGISTER_SESSION_COOKIE, token, registerSessionCookieOptions());
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    if (message === "NO_OPEN_BUSINESS_DAY") {
      return NextResponse.json({ error: "Open a business day first" }, { status: 409 });
    }
    if (message === "REGISTER_NOT_AVAILABLE") {
      return NextResponse.json({ error: "Register is not available" }, { status: 409 });
    }
    if (message === "REGISTER_ALREADY_OPEN") {
      return NextResponse.json({ error: "Register already has an open session" }, { status: 409 });
    }
    if (message === "CASHIER_NOT_AVAILABLE") {
      return NextResponse.json({ error: "Cashier is not available" }, { status: 409 });
    }
    console.error("Open register session failed:", error);
    return NextResponse.json({ error: "Could not open register session" }, { status: 500 });
  }
}
