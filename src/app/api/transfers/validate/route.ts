import { NextResponse } from "next/server";
import { getActiveUser } from "@/lib/current-user";
import { validatePendingTransfers } from "@/lib/validate-transfers";

export const runtime = "nodejs";

export async function POST() {
  const user = await getActiveUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await validatePendingTransfers();
  if (result.error) {
    return NextResponse.json(result, { status: 502 });
  }

  return NextResponse.json(result);
}
