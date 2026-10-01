import { cookies } from "next/headers";
import {
  REGISTER_SESSION_COOKIE,
  verifyRegisterSessionToken,
} from "@/lib/register-session-cookie";
import { getRegisterSessionById, liveSessionSummary } from "@/lib/register-store";

export async function readRegisterSessionIdFromCookie(): Promise<number | null> {
  const jar = await cookies();
  return verifyRegisterSessionToken(jar.get(REGISTER_SESSION_COOKIE)?.value);
}

export async function getActiveRegisterSessionFromCookie() {
  const sessionId = await readRegisterSessionIdFromCookie();
  if (!sessionId) return null;

  const session = await getRegisterSessionById(sessionId);
  if (!session || session.status !== "open") return null;

  const summary = await liveSessionSummary(sessionId);
  return { session, summary };
}
