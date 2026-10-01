import { NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { nowTimestamp } from "@/prisma/dates";
import { requireAdmin, toPublicUser } from "@/lib/current-user";
import { hashPassword } from "@/lib/password";
import { USER_ROLES, type UserRole } from "@/types/user";

const USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/;

function isRole(value: string): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.status === 401 ? "unauthorized" : "forbidden" }, { status: auth.status });
  }

  const users = await db.orm.public.User
    .select("id", "name", "username", "role", "active", "createdAt")
    .orderBy((user) => user.name.asc())
    .all();

  return NextResponse.json(users.map(toPublicUser));
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.status === 401 ? "unauthorized" : "forbidden" }, { status: auth.status });
  }

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const username = String(body.username ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const role = String(body.role ?? "");

  if (!name || name.length > 80) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }
  if (!USERNAME_PATTERN.test(username)) {
    return NextResponse.json({ error: "invalid_username" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "invalid_password" }, { status: 400 });
  }
  if (!isRole(role)) {
    return NextResponse.json({ error: "invalid_role" }, { status: 400 });
  }

  const taken = await db.orm.public.User.where({ username }).first();
  if (taken) {
    return NextResponse.json({ error: "username_taken" }, { status: 409 });
  }

  const user = await db.orm.public.User
    .select("id", "name", "username", "role", "active", "createdAt")
    .create({
      name,
      username,
      passwordHash: await hashPassword(password),
      role,
      active: true,
      updatedAt: nowTimestamp(),
    });

  return NextResponse.json(toPublicUser(user), { status: 201 });
}
