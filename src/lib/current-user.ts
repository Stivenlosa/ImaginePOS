import { cookies } from "next/headers";
import { db } from "@/prisma/db";
import { timestampToIso } from "@/prisma/dates";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/session";
import type { PublicUser, SessionUser } from "@/types/user";

const publicFields = ["id", "name", "username", "role", "active", "createdAt"] as const;

export function toPublicUser(user: {
  id: number;
  name: string;
  username: string;
  role: PublicUser["role"];
  active: boolean;
  createdAt: Parameters<typeof timestampToIso>[0];
}): PublicUser {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    active: user.active,
    createdAt: timestampToIso(user.createdAt),
  };
}

export async function readSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}

export async function getActiveUser() {
  const session = await readSession();
  if (!session) return null;

  const user = await db.orm.public.User.where({ id: session.id }).select(...publicFields).first();
  if (!user?.active) return null;
  return user;
}

export async function requireAdmin() {
  const user = await getActiveUser();
  if (!user) return { ok: false as const, status: 401 };
  if (user.role !== "administrador") return { ok: false as const, status: 403 };
  return { ok: true as const, user };
}
