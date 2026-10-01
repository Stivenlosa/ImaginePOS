import "temporal-polyfill/full/global";
import "temporal-polyfill/types/global";
import { moneyEquals, parseMoney } from "@/lib/money";

/** Bank messages use Colombian local time (llaves / Bre-B). */
export const STORE_TIME_ZONE = "America/Bogota";

const TRANSFER_PATTERN =
  /recibiste una transferencia de\s+(.+?)\s+por\s+\$?\s*([0-9][0-9.,]*)\s+en tu cuenta\s+\*(\d+)\s+conectada a la llave\s+(@?[^\s]+)\s+el\s+(\d{2}\/\d{2}\/\d{2})\s+a las\s+(\d{1,2}:\d{2})/gi;

export type ParsedTransfer = {
  payerName: string;
  amount: number;
  account: string;
  llave: string;
  occurredAt: Date;
};

export function normalizeLlave(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return "";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

export function parseAmount(raw: string): number | null {
  return parseMoney(raw);
}

export function parseTransferMessages(text: string): ParsedTransfer[] {
  const normalized = text
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ");

  const results: ParsedTransfer[] = [];
  for (const match of normalized.matchAll(new RegExp(TRANSFER_PATTERN.source, "gi"))) {
    const amount = parseAmount(match[2] ?? "");
    const occurredAt = parseLocalDateTime(match[5] ?? "", match[6] ?? "");
    if (amount === null || !occurredAt) continue;

    results.push({
      payerName: (match[1] ?? "").trim().replace(/\s+/g, " "),
      amount,
      account: match[3] ?? "",
      llave: normalizeLlave(match[4] ?? ""),
      occurredAt,
    });
  }

  return results;
}

function parseLocalDateTime(date: string, time: string): Date | null {
  const [day, month, year] = date.split("/").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  if (!day || !month || year === undefined || hour === undefined || minute === undefined) return null;

  try {
    const plain = Temporal.PlainDateTime.from({
      year: year < 100 ? 2000 + year : year,
      month,
      day,
      hour,
      minute,
    });
    return new Date(plain.toZonedDateTime(STORE_TIME_ZONE).epochMilliseconds);
  } catch {
    return null;
  }
}

export function isSameLocalDay(instant: Date, now: Date): boolean {
  const emailDay = Temporal.Instant.fromEpochMilliseconds(instant.getTime())
    .toZonedDateTimeISO(STORE_TIME_ZONE)
    .toPlainDate();
  const today = Temporal.Instant.fromEpochMilliseconds(now.getTime())
    .toZonedDateTimeISO(STORE_TIME_ZONE)
    .toPlainDate();
  return Temporal.PlainDate.compare(emailDay, today) === 0;
}

export function startOfLocalDay(now: Date): Date {
  const day = Temporal.Instant.fromEpochMilliseconds(now.getTime())
    .toZonedDateTimeISO(STORE_TIME_ZONE)
    .toPlainDate();
  return new Date(day.toZonedDateTime(STORE_TIME_ZONE).epochMilliseconds);
}

export function withinMinutes(a: Date, b: Date, minutes: number): boolean {
  return Math.abs(a.getTime() - b.getTime()) <= minutes * 60 * 1000;
}

export function amountsMatch(left: number, right: number): boolean {
  return moneyEquals(left, right);
}
