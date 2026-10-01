import { NextResponse } from "next/server";
import { listBankTransfers } from "@/lib/bank-transfer-store";
import { CASHIER_RECENT_TRANSFER_LIMIT } from "@/lib/transfer-limits";
import { getActiveUser } from "@/lib/current-user";

export async function GET(request: Request) {
  const user = await getActiveUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const limitParam = new URL(request.url).searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;
  const transfers = await listBankTransfers(
    user.role === "administrador" && !limitParam
      ? undefined
      : Math.min(limit || CASHIER_RECENT_TRANSFER_LIMIT, CASHIER_RECENT_TRANSFER_LIMIT),
  );

  return NextResponse.json({ transfers });
}
