import { NextResponse } from "next/server";
import { normalizeLlave } from "@/lib/bank-transfer";
import { requireAdmin } from "@/lib/current-user";
import { nowTimestamp, timestampToIso } from "@/prisma/dates";
import { db } from "@/prisma/db";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toPublicConfig(config: {
  gmailAddress: string;
  llave: string;
  timeWindowMinutes: number;
  gmailAppPassword: string;
  updatedAt: Parameters<typeof timestampToIso>[0];
}) {
  return {
    gmailAddress: config.gmailAddress,
    llave: config.llave,
    timeWindowMinutes: config.timeWindowMinutes,
    passwordSet: config.gmailAppPassword.length > 0,
    updatedAt: timestampToIso(config.updatedAt),
  };
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.status === 401 ? "unauthorized" : "forbidden" }, { status: auth.status });
  }

  const config = await db.orm.public.TransferConfig.orderBy((row) => row.id.desc()).first();
  return NextResponse.json({ config: config ? toPublicConfig(config) : null });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.status === 401 ? "unauthorized" : "forbidden" }, { status: auth.status });
  }

  const body = await request.json();
  const gmailAddress = String(body.gmailAddress ?? "").trim().toLowerCase();
  const llave = normalizeLlave(String(body.llave ?? ""));
  const timeWindowMinutes = Number(body.timeWindowMinutes);
  const password = body.gmailAppPassword === undefined ? "" : String(body.gmailAppPassword).replace(/\s+/g, "");

  if (!EMAIL_PATTERN.test(gmailAddress)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (!llave || llave.length > 80) {
    return NextResponse.json({ error: "invalid_llave" }, { status: 400 });
  }
  if (!Number.isInteger(timeWindowMinutes) || timeWindowMinutes < 5 || timeWindowMinutes > 240) {
    return NextResponse.json({ error: "invalid_window" }, { status: 400 });
  }

  const current = await db.orm.public.TransferConfig.orderBy((row) => row.id.desc()).first();
  if ((!current || password) && password.length !== 16) {
    return NextResponse.json({ error: "invalid_password" }, { status: 400 });
  }

  const saved = current
    ? await db.orm.public.TransferConfig.where({ id: current.id }).update({
        gmailAddress,
        llave,
        timeWindowMinutes,
        updatedAt: nowTimestamp(),
        ...(password ? { gmailAppPassword: password } : {}),
      })
    : await db.orm.public.TransferConfig.create({
        gmailAddress,
        gmailAppPassword: password,
        llave,
        timeWindowMinutes,
        updatedAt: nowTimestamp(),
      });

  if (!saved) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ config: toPublicConfig(saved) });
}
