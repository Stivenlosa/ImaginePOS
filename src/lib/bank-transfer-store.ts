import { timestampToDate, timestampToIso } from "@/prisma/dates";
import { db } from "@/prisma/db";

export type PublicBankTransfer = {
  id: number;
  payerName: string;
  amount: number;
  account: string;
  llave: string;
  occurredAt: string;
  purchaseId: number | null;
  orderNumber: string | null;
  transferStatus: "pending" | "validated" | null;
};

type BankRow = {
  id: number;
  payerName: string;
  amount: number;
  account: string;
  llave: string;
  occurredAt: Temporal.PlainDateTime;
  purchaseId: number | null;
  purchase: {
    orderNumber: string;
    transferStatus: "pending" | "validated" | null;
  } | null;
};

export function toPublicBankTransfer(row: BankRow): PublicBankTransfer {
  return {
    id: row.id,
    payerName: row.payerName,
    amount: row.amount,
    account: row.account,
    llave: row.llave,
    occurredAt: timestampToIso(row.occurredAt),
    purchaseId: row.purchaseId,
    orderNumber: row.purchase?.orderNumber ?? null,
    transferStatus: row.purchase?.transferStatus ?? (row.purchaseId ? "pending" : null),
  };
}

export async function listBankTransfers(limit?: number) {
  const rows = await db.orm.public.BankTransfer
    .include("purchase")
    .orderBy((row) => row.occurredAt.desc())
    .all();

  const publicRows = rows.map((row) => toPublicBankTransfer(row as BankRow));
  return limit ? publicRows.slice(0, limit) : publicRows;
}

export function bankTransferMoment(row: { occurredAt: Temporal.PlainDateTime }) {
  return timestampToDate(row.occurredAt);
}
