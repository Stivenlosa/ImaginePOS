import { NextResponse } from "next/server";
import { getActiveRegisterSessionFromCookie } from "@/lib/register-session";
import { serializeRegisterSession } from "@/lib/register-store";

export async function GET() {
  const active = await getActiveRegisterSessionFromCookie();
  if (!active) {
    return NextResponse.json({ session: null });
  }

  return NextResponse.json({
    session: serializeRegisterSession(active.session, active.summary ?? undefined),
  });
}
