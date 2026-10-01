import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/current-user";
import { nowTimestamp, timestampToIso } from "@/prisma/dates";
import { db } from "@/prisma/db";

const STATUSES = ["pending", "validated"] as const;
type TransferStatus = (typeof STATUSES)[number];

function isStatus(value: string): value is TransferStatus {
  return STATUSES.includes(value as TransferStatus);
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

  const purchase = await db.orm.public.Purchase.where({ id }).first();
  if (!purchase) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (purchase.paymentType !== "transfer") {
    return NextResponse.json({ error: "not_transfer" }, { status: 400 });
  }

  const body = await request.json();
  const transferStatus = String(body.transferStatus ?? "");
  if (!isStatus(transferStatus)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const validating = transferStatus === "validated";
  const updated = await db.orm.public.Purchase.where({ id }).update({
    transferStatus,
    payerName: validating ? purchase.payerName : null,
    validatedAt: validating ? nowTimestamp() : null,
    transferMessageId: validating ? purchase.transferMessageId : null,
    updatedAt: nowTimestamp(),
  });

  if (!updated) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    id: updated.id,
    transferStatus: updated.transferStatus,
    payerName: updated.payerName,
    validatedAt: updated.validatedAt ? timestampToIso(updated.validatedAt) : null,
  });
}
