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

async function activeAdminCount() {
  const admins = await db.orm.public.User
    .where({ role: "administrador", active: true })
    .select("id")
    .all();
  return admins.length;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.status === 401 ? "unauthorized" : "forbidden" }, { status: auth.status });
  }

  const { id: idParam } = await context.params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const current = await db.orm.public.User.where({ id }).first();
  if (!current) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = await request.json();
  const name = body.name === undefined ? current.name : String(body.name).trim();
  const username = body.username === undefined ? current.username : String(body.username).trim().toLowerCase();
  const role = body.role === undefined ? current.role : String(body.role);
  const active = body.active === undefined ? current.active : Boolean(body.active);
  const password = body.password === undefined ? "" : String(body.password);

  if (!name || name.length > 80) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }
  if (!USERNAME_PATTERN.test(username)) {
    return NextResponse.json({ error: "invalid_username" }, { status: 400 });
  }
  if (!isRole(role)) {
    return NextResponse.json({ error: "invalid_role" }, { status: 400 });
  }
  if (password && password.length < 6) {
    return NextResponse.json({ error: "invalid_password" }, { status: 400 });
  }

  if (username !== current.username) {
    const taken = await db.orm.public.User.where({ username }).first();
    if (taken) {
      return NextResponse.json({ error: "username_taken" }, { status: 409 });
    }
  }

  const removesLastAdmin =
    current.role === "administrador" &&
    current.active &&
    (role !== "administrador" || !active) &&
    (await activeAdminCount()) <= 1;

  if (removesLastAdmin) {
    return NextResponse.json({ error: "last_admin" }, { status: 400 });
  }

  if (current.id === auth.user.id && !active) {
    return NextResponse.json({ error: "self_deactivate" }, { status: 400 });
  }

  const updated = await db.orm.public.User
    .where({ id })
    .select("id", "name", "username", "role", "active", "createdAt")
    .update({
      name,
      username,
      role,
      active,
      updatedAt: nowTimestamp(),
      ...(password ? { passwordHash: await hashPassword(password) } : {}),
    });

  if (!updated) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(toPublicUser(updated));
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.status === 401 ? "unauthorized" : "forbidden" }, { status: auth.status });
  }

  const { id: idParam } = await context.params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const current = await db.orm.public.User.where({ id }).first();
  if (!current) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (current.id === auth.user.id) {
    return NextResponse.json({ error: "self_delete" }, { status: 400 });
  }

  if (current.role === "administrador" && current.active && (await activeAdminCount()) <= 1) {
    return NextResponse.json({ error: "last_admin" }, { status: 400 });
  }

  await db.orm.public.User.where({ id }).delete();
  return NextResponse.json({ ok: true });
}
