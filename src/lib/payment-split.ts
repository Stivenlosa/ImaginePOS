import { moneyEquals, roundMoney } from "@/lib/money";
import { PAYMENT_TYPES, type PaymentType } from "@/types/product";

export type TenderLine = {
  type: PaymentType;
  amount: number;
};

export type PaymentAmounts = {
  total: number;
  paymentType: PaymentType;
  cashAmount?: number | null;
  cardAmount?: number | null;
  transferAmount?: number | null;
};

export type TenderResolution = {
  lines: TenderLine[];
  fields: Partial<Record<PaymentType, number | null>>;
  autoType: PaymentType | null;
  remaining: number;
  ready: boolean;
  error: "over" | "incomplete" | "mismatch" | null;
};

type StoredAmounts = {
  paymentType: PaymentType;
  cashAmount: number;
  cardAmount: number;
  transferAmount: number;
};

export function parseTenderDraft(raw: string | undefined): number | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  const value = Number(digits);
  if (!Number.isSafeInteger(value)) return null;
  return value;
}

/**
 * Split a sale across the selected methods.
 * One method takes the whole total.
 * Two methods: the amount the cashier types is kept, and the other method becomes the remainder.
 * Three methods: each amount is typed, and they must add up to the total.
 */
export function resolveTender(input: {
  total: number;
  selected: readonly PaymentType[];
  typed: Partial<Record<PaymentType, number | null>>;
  drivenBy: PaymentType | null;
}): TenderResolution {
  const total = roundMoney(input.total);
  const selected = PAYMENT_TYPES.filter((type) => input.selected.includes(type));
  const empty: TenderResolution = {
    lines: [],
    fields: {},
    autoType: null,
    remaining: total,
    ready: false,
    error: "incomplete",
  };
  if (selected.length === 0 || total <= 0) return empty;

  if (selected.length === 1) {
    return {
      lines: [{ type: selected[0], amount: total }],
      fields: {},
      autoType: null,
      remaining: 0,
      ready: true,
      error: null,
    };
  }

  if (selected.length === 2) {
    return resolvePair(total, selected[0], selected[1], input.typed, input.drivenBy);
  }

  return resolveManual(total, selected, input.typed);
}

export function paymentShares(row: PaymentAmounts): TenderLine[] {
  const cash = roundMoney(row.cashAmount ?? 0);
  const card = roundMoney(row.cardAmount ?? 0);
  const transfer = roundMoney(row.transferAmount ?? 0);
  const shares: TenderLine[] = [];
  if (cash > 0) shares.push({ type: "cash", amount: cash });
  if (card > 0) shares.push({ type: "card", amount: card });
  if (transfer > 0) shares.push({ type: "transfer", amount: transfer });
  if (shares.length === 0) {
    return [{ type: row.paymentType, amount: roundMoney(row.total) }];
  }
  return shares;
}

export function transferPortion(row: PaymentAmounts): number {
  return paymentShares(row).find((share) => share.type === "transfer")?.amount ?? 0;
}

export function hasTransferPayment(row: PaymentAmounts): boolean {
  return transferPortion(row) > 0;
}

export function columnsForPayments(total: number, payments: TenderLine[]): StoredAmounts | null {
  if (payments.length < 1 || payments.length > PAYMENT_TYPES.length) return null;

  const seen = new Set<PaymentType>();
  let cashAmount = 0;
  let cardAmount = 0;
  let transferAmount = 0;
  let sum = 0;

  for (const payment of payments) {
    const amount = roundMoney(payment.amount);
    if (!PAYMENT_TYPES.includes(payment.type) || seen.has(payment.type) || amount <= 0) return null;
    seen.add(payment.type);
    sum += amount;
    if (payment.type === "cash") cashAmount = amount;
    else if (payment.type === "card") cardAmount = amount;
    else transferAmount = amount;
  }

  if (!moneyEquals(sum, total)) return null;

  return {
    paymentType: primaryPaymentType(payments),
    cashAmount,
    cardAmount,
    transferAmount,
  };
}

function primaryPaymentType(lines: TenderLine[]): PaymentType {
  return [...lines].sort(
    (left, right) =>
      right.amount - left.amount || PAYMENT_TYPES.indexOf(left.type) - PAYMENT_TYPES.indexOf(right.type),
  )[0].type;
}

function resolvePair(
  total: number,
  first: PaymentType,
  second: PaymentType,
  typed: Partial<Record<PaymentType, number | null>>,
  drivenBy: PaymentType | null,
): TenderResolution {
  const selected = [first, second];
  const driver =
    drivenBy && selected.includes(drivenBy) && typed[drivenBy] != null
      ? drivenBy
      : (selected.find((type) => typed[type] != null) ?? null);

  if (!driver) {
    return {
      lines: [],
      fields: { [first]: null, [second]: null },
      autoType: null,
      remaining: total,
      ready: false,
      error: "incomplete",
    };
  }

  const paid = roundMoney(typed[driver] ?? 0);
  const other = selected.find((type) => type !== driver) ?? second;
  if (paid <= 0) {
    return {
      lines: [],
      fields: { [driver]: paid, [other]: null },
      autoType: other,
      remaining: total,
      ready: false,
      error: "incomplete",
    };
  }
  if (paid > total) {
    return {
      lines: [],
      fields: { [driver]: paid, [other]: null },
      autoType: other,
      remaining: roundMoney(total - paid),
      ready: false,
      error: "over",
    };
  }

  const rest = roundMoney(total - paid);
  if (rest <= 0) {
    return {
      lines: [{ type: driver, amount: paid }],
      fields: { [driver]: paid, [other]: 0 },
      autoType: other,
      remaining: 0,
      ready: false,
      error: "incomplete",
    };
  }

  return {
    lines: orderLines([
      { type: driver, amount: paid },
      { type: other, amount: rest },
    ]),
    fields: { [driver]: paid, [other]: rest },
    autoType: other,
    remaining: 0,
    ready: true,
    error: null,
  };
}

function resolveManual(
  total: number,
  selected: PaymentType[],
  typed: Partial<Record<PaymentType, number | null>>,
): TenderResolution {
  let sum = 0;
  let missing = false;
  let nonPositive = false;
  const fields: Partial<Record<PaymentType, number | null>> = {};
  const lines: TenderLine[] = [];

  for (const type of selected) {
    const value = typed[type];
    fields[type] = value ?? null;
    if (value == null) {
      missing = true;
      continue;
    }
    const amount = roundMoney(value);
    if (amount <= 0) nonPositive = true;
    sum += amount;
    lines.push({ type, amount });
  }

  const remaining = roundMoney(total - sum);
  if (sum > total) {
    return { lines, fields, autoType: null, remaining, ready: false, error: "over" };
  }
  if (missing || nonPositive) {
    return { lines, fields, autoType: null, remaining, ready: false, error: "incomplete" };
  }
  if (remaining !== 0) {
    return { lines, fields, autoType: null, remaining, ready: false, error: "mismatch" };
  }
  return { lines, fields, autoType: null, remaining: 0, ready: true, error: null };
}

function orderLines(lines: TenderLine[]): TenderLine[] {
  return [...lines].sort((left, right) => PAYMENT_TYPES.indexOf(left.type) - PAYMENT_TYPES.indexOf(right.type));
}
