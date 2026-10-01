/** Colombian peso. Centavos are not used in circulation. */
export const CURRENCY_CODE = "COP";
export const CURRENCY_LOCALE = "es-CO";

const moneyFormat = new Intl.NumberFormat(CURRENCY_LOCALE, {
  style: "currency",
  currency: CURRENCY_CODE,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value);
}

/** Display amount as Colombian pesos, for example `$ 3.500`. */
export function formatMoney(value: number): string {
  return moneyFormat.format(roundMoney(value));
}

/** Whole-peso string for cash and price inputs. */
export function formatMoneyInput(value: number): string {
  return String(roundMoney(value));
}

export function moneyEquals(left: number, right: number): boolean {
  return roundMoney(left) === roundMoney(right);
}

/**
 * Parse a peso amount from a bank message or typed value.
 * Colombian grouping uses `.` (`20.000` = 20000). A trailing `.00` or `,00` is cents and is dropped.
 */
export function parseMoney(raw: string): number | null {
  const cleaned = raw.trim().replace(/\$/g, "").replace(/\s/g, "");
  if (!cleaned || !/^\d[\d.,]*$/.test(cleaned)) return null;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let whole = cleaned;
  let fraction = "";

  if (lastComma !== -1 || lastDot !== -1) {
    const separator = Math.max(lastComma, lastDot);
    const after = cleaned.slice(separator + 1);
    if (/^\d{3}$/.test(after)) {
      whole = cleaned.replace(/[.,]/g, "");
    } else if (after.length <= 2) {
      whole = cleaned.slice(0, separator).replace(/[.,]/g, "");
      fraction = after;
    } else {
      whole = cleaned.replace(/[.,]/g, "");
    }
  }

  const amount = Number(fraction ? `${whole}.${fraction}` : whole);
  if (!Number.isFinite(amount)) return null;
  return roundMoney(amount);
}
