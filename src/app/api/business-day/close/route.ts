import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/current-user";
import { closeBusinessDay, serializeBusinessDay } from "@/lib/register-store";

export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.status === 401 ? "unauthorized" : "forbidden" }, { status: auth.status });
  }

  try {
    const day = await closeBusinessDay(auth.user.id);
    return NextResponse.json(serializeBusinessDay(day));
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    if (message === "NO_OPEN_BUSINESS_DAY") {
      return NextResponse.json({ error: "No open business day" }, { status: 409 });
    }
    if (message === "REGISTER_SESSIONS_STILL_OPEN") {
      return NextResponse.json({ error: "Close all register sessions before closing the day" }, { status: 409 });
    }
    console.error("Close business day failed:", error);
    return NextResponse.json({ error: "Could not close business day" }, { status: 500 });
  }
}
