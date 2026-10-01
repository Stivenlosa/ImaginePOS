import { roundMoney } from "@/lib/money";
import { paymentShares, type PaymentAmounts } from "@/lib/payment-split";
import type { PaymentTotals, RegisterSessionSummary } from "@/types/register";

export { roundMoney };

type PurchaseRow = PaymentAmounts;

export function aggregatePurchases(purchases: PurchaseRow[]): PaymentTotals {
  let cashTotal = 0;
  let cardTotal = 0;
  let transferTotal = 0;

  for (const purchase of purchases) {
    for (const share of paymentShares(purchase)) {
      if (share.type === "cash") cashTotal += share.amount;
      else if (share.type === "card") cardTotal += share.amount;
      else transferTotal += share.amount;
    }
  }

  const totalSales = cashTotal + cardTotal + transferTotal;

  return {
    purchaseCount: purchases.length,
    totalSales: roundMoney(totalSales),
    cashTotal: roundMoney(cashTotal),
    cardTotal: roundMoney(cardTotal),
    transferTotal: roundMoney(transferTotal),
  };
}

export function computeExpectedCash(openingFloat: number, cashTotal: number): number {
  return roundMoney(openingFloat + cashTotal);
}

export function computeCashVariance(expectedCash: number, countedCash: number): number {
  return roundMoney(countedCash - expectedCash);
}

export function buildSessionSummary(
  openingFloat: number,
  purchases: PurchaseRow[],
): RegisterSessionSummary {
  const totals = aggregatePurchases(purchases);
  return {
    ...totals,
    openingFloat: roundMoney(openingFloat),
    expectedCash: computeExpectedCash(openingFloat, totals.cashTotal),
  };
}

export function sumPaymentTotals(totals: PaymentTotals[]): PaymentTotals {
  const merged = totals.reduce(
    (acc, row) => ({
      purchaseCount: acc.purchaseCount + row.purchaseCount,
      totalSales: acc.totalSales + row.totalSales,
      cashTotal: acc.cashTotal + row.cashTotal,
      cardTotal: acc.cardTotal + row.cardTotal,
      transferTotal: acc.transferTotal + row.transferTotal,
    }),
    {
      purchaseCount: 0,
      totalSales: 0,
      cashTotal: 0,
      cardTotal: 0,
      transferTotal: 0,
    },
  );

  return {
    purchaseCount: merged.purchaseCount,
    totalSales: roundMoney(merged.totalSales),
    cashTotal: roundMoney(merged.cashTotal),
    cardTotal: roundMoney(merged.cardTotal),
    transferTotal: roundMoney(merged.transferTotal),
  };
}
