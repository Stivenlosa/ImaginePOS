import { NextResponse } from "next/server";
import { CASHIER_RECENT_TRANSFER_LIMIT } from "@/lib/transfer-limits";
import { getActiveUser } from "@/lib/current-user";
import { syncTransferInbox } from "@/lib/validate-transfers";

export const runtime = "nodejs";

export async function POST() {
  const user = await getActiveUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await syncTransferInbox(new Date(), { announce: true });
  if (result.error) {
    return NextResponse.json(result, { status: 502 });
  }

  if (user.role !== "administrador") {
    result.recent = result.recent.slice(0, CASHIER_RECENT_TRANSFER_LIMIT);
  }

  return NextResponse.json(result);
}
