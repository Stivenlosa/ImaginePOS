import { NextResponse } from "next/server";
import { listBankTransfers } from "@/lib/bank-transfer-store";
import { getActiveUser } from "@/lib/current-user";

export async function GET(request: Request) {
  const user = await getActiveUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const limitParam = new URL(request.url).searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;
  const transfers = await listBankTransfers(
    user.role === "administrador" && !limitParam ? undefined : Math.min(limit || 8, 8),
  );

  return NextResponse.json({ transfers });
}
