import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/current-user";
import { timestampToIso } from "@/prisma/dates";
import {
  getOpenBusinessDay,
  listClosedBusinessDays,
  listSessionsForBusinessDay,
  liveSessionSummary,
  openBusinessDay,
  serializeBusinessDay,
} from "@/lib/register-store";

export async function GET() {
  const openDay = await getOpenBusinessDay();
  const closedDays = await listClosedBusinessDays(20);

  let sessions: Awaited<ReturnType<typeof listSessionsForBusinessDay>> = [];
  if (openDay) {
    sessions = await listSessionsForBusinessDay(openDay.id);
  }

  const sessionsWithSummary = await Promise.all(
    sessions.map(async (session) => {
      const summary = session.status === "open" ? await liveSessionSummary(session.id) : null;
      return {
        id: session.id,
        status: session.status,
        openingFloat: session.openingFloat,
        openedAt: timestampToIso(session.openedAt),
        closedAt: session.closedAt ? timestampToIso(session.closedAt) : null,
        register: session.register,
        cashier: session.cashier,
        closeSnapshot:
          session.status === "closed"
            ? {
                purchaseCount: session.purchaseCount,
                totalSales: session.totalSales,
                cashTotal: session.cashTotal,
                cardTotal: session.cardTotal,
                transferTotal: session.transferTotal,
                expectedCash: session.expectedCash,
                countedCash: session.countedCash,
                cashVariance: session.cashVariance,
              }
            : summary,
      };
    }),
  );

  return NextResponse.json({
    openDay: serializeBusinessDay(openDay),
    closedDays: closedDays.map((day: (typeof closedDays)[number]) => serializeBusinessDay(day)),
    sessions: sessionsWithSummary,
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.status === 401 ? "unauthorized" : "forbidden" }, { status: auth.status });
  }

  const body = (await request.json().catch(() => ({}))) as { businessDate?: string };
  try {
    const result = await openBusinessDay(auth.user.id, body.businessDate);
    const day = await getOpenBusinessDay();
    return NextResponse.json({ ...serializeBusinessDay(day), reopened: result.reopened }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    if (message === "BUSINESS_DAY_ALREADY_OPEN") {
      return NextResponse.json({ code: "BUSINESS_DAY_ALREADY_OPEN" }, { status: 409 });
    }
    console.error("Open business day failed:", error);
    return NextResponse.json({ code: "OPEN_DAY_FAILED" }, { status: 500 });
  }
}
