import {
  amountsMatch,
  isSameLocalDay,
  normalizeLlave,
  parseTransferMessages,
  startOfLocalDay,
  withinMinutes,
} from "@/lib/bank-transfer";
import { hasTransferPayment, transferPortion } from "@/lib/payment-split";
import { listBankTransfers, type PublicBankTransfer } from "@/lib/bank-transfer-store";
import { GmailReadError, readRecentGmail } from "@/lib/read-gmail";
import { nowTimestamp, timestampFromDate, timestampToDate } from "@/prisma/dates";
import { db } from "@/prisma/db";

export type TransferNotice = {
  nombre: string;
  valor: number;
};

export type TransferCheckResult = {
  configured: boolean;
  messagesRead: number;
  transfersFound: number;
  updated: number;
  payments: TransferNotice[];
  recent: PublicBankTransfer[];
  error?: "invalid_credentials" | "email_unreachable";
};

type ParsedInboxTransfer = {
  messageId: string;
  payerName: string;
  amount: number;
  account: string;
  llave: string;
  occurredAt: Date;
};

export async function syncTransferInbox(now = new Date(), options?: { announce?: boolean }): Promise<TransferCheckResult> {
  const empty = {
    configured: false,
    messagesRead: 0,
    transfersFound: 0,
    updated: 0,
    payments: [] as TransferNotice[],
    recent: [] as PublicBankTransfer[],
  };
  const config = await db.orm.public.TransferConfig.orderBy((row) => row.id.desc()).first();
  if (!config) return empty;

  let messages;
  try {
    messages = await readRecentGmail(config.gmailAddress, config.gmailAppPassword);
  } catch (error) {
    const reason = error instanceof GmailReadError ? error.reason : "email_unreachable";
    console.error("Could not read the transfer inbox:", reason);
    return { ...empty, configured: true, error: reason };
  }

  const transfers: ParsedInboxTransfer[] = [];
  for (const message of messages) {
    const seen = new Set<string>();
    for (const transfer of parseTransferMessages(message.text)) {
      const signature = `${transfer.llave}|${transfer.amount}|${transfer.occurredAt.toISOString()}|${transfer.payerName}`;
      if (seen.has(signature)) continue;
      seen.add(signature);
      transfers.push({
        messageId: seen.size === 1 ? message.id : `${message.id}#${seen.size}`,
        payerName: transfer.payerName,
        amount: transfer.amount,
        account: transfer.account,
        llave: transfer.llave,
        occurredAt: transfer.occurredAt,
      });
    }
  }

  await saveBankTransfers(transfers);
  const updated = await matchPendingPurchases(transfers, config.llave, config.timeWindowMinutes, now);
  const payments = options?.announce ? await announceUnreadTransfers(now) : [];
  const recent = await listBankTransfers(8);

  return {
    configured: true,
    messagesRead: messages.length,
    transfersFound: transfers.length,
    updated,
    payments,
    recent,
  };
}

async function saveBankTransfers(transfers: ParsedInboxTransfer[]) {
  for (const transfer of transfers) {
    const occurredAt = timestampFromDate(transfer.occurredAt);
    const existing = await db.orm.public.BankTransfer.where({ messageId: transfer.messageId }).first();
    if (existing) {
      await db.orm.public.BankTransfer.where({ id: existing.id }).update({
        payerName: transfer.payerName,
        amount: transfer.amount,
        account: transfer.account,
        llave: transfer.llave,
        occurredAt,
      });
      continue;
    }

    await db.orm.public.BankTransfer.create({
      messageId: transfer.messageId,
      payerName: transfer.payerName,
      amount: transfer.amount,
      account: transfer.account,
      llave: transfer.llave,
      occurredAt,
    });
  }
}

async function matchPendingPurchases(
  transfers: ParsedInboxTransfer[],
  llave: string,
  timeWindowMinutes: number,
  now: Date,
) {
  const purchases = await db.orm.public.Purchase
    .where((purchase) => purchase.createdAt.gte(timestampFromDate(startOfLocalDay(now))))
    .select(
      "id",
      "total",
      "paymentType",
      "cashAmount",
      "cardAmount",
      "transferAmount",
      "transferStatus",
      "transferMessageId",
      "createdAt",
    )
    .all();

  const withTransfer = purchases.filter((purchase) => hasTransferPayment(purchase));
  const pending = withTransfer.filter((purchase) => purchase.transferStatus !== "validated");
  if (pending.length === 0) return 0;

  const expectedLlave = normalizeLlave(llave);
  const usedMessageIds = new Set(
    withTransfer.map((purchase) => purchase.transferMessageId).filter((id): id is string => Boolean(id)),
  );
  const candidates = transfers.filter(
    (transfer) =>
      transfer.llave === expectedLlave &&
      isSameLocalDay(transfer.occurredAt, now) &&
      !usedMessageIds.has(transfer.messageId),
  );

  const claimed = new Set<string>();
  let updated = 0;

  for (const purchase of pending) {
    const purchaseAt = timestampToDate(purchase.createdAt);
    const match = candidates
      .filter((candidate) => !claimed.has(candidate.messageId))
      .filter((candidate) => amountsMatch(candidate.amount, transferPortion(purchase)))
      .filter((candidate) => withinMinutes(candidate.occurredAt, purchaseAt, timeWindowMinutes))
      .sort(
        (left, right) =>
          Math.abs(left.occurredAt.getTime() - purchaseAt.getTime()) -
          Math.abs(right.occurredAt.getTime() - purchaseAt.getTime()),
      )[0];

    if (!match) continue;

    try {
      await db.orm.public.Purchase.where({ id: purchase.id }).update({
        transferStatus: "validated",
        payerName: match.payerName,
        validatedAt: nowTimestamp(),
        transferMessageId: match.messageId,
        updatedAt: nowTimestamp(),
      });
      const bankRow = await db.orm.public.BankTransfer.where({ messageId: match.messageId }).first();
      if (bankRow && bankRow.purchaseId == null) {
        await db.orm.public.BankTransfer.where({ id: bankRow.id }).update({ purchaseId: purchase.id });
      }
      claimed.add(match.messageId);
      updated += 1;
    } catch (error) {
      console.error(`Could not mark purchase ${purchase.id} as validated`);
      console.error(error instanceof Error ? error.message : error);
    }
  }

  return updated;
}

async function announceUnreadTransfers(now: Date) {
  const rows = await db.orm.public.BankTransfer.orderBy((row) => row.occurredAt.desc()).all();
  const payments: TransferNotice[] = [];

  for (const row of rows) {
    if (row.announcedAt) continue;
    if (!isSameLocalDay(timestampToDate(row.occurredAt), now)) continue;

    await db.orm.public.BankTransfer.where({ id: row.id }).update({ announcedAt: nowTimestamp() });
    payments.push({ nombre: row.payerName, valor: row.amount });
  }

  return payments;
}

export async function validatePendingTransfers(now = new Date()) {
  return syncTransferInbox(now);
}
