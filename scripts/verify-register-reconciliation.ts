import { columnsForPayments, paymentShares, resolveTender, transferPortion } from "../src/lib/payment-split";
import {
  aggregatePurchases,
  buildSessionSummary,
  computeCashVariance,
  sumPaymentTotals,
} from "../src/lib/register-reconciliation";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const purchases = [
  { total: 10000, paymentType: "cash" as const },
  { total: 25500.4, paymentType: "card" as const },
  { total: 4500.6, paymentType: "transfer" as const },
  { total: 6000, paymentType: "cash" as const },
];

const totals = aggregatePurchases(purchases);
assert(totals.purchaseCount === 4, "purchase count");
assert(totals.cashTotal === 16000, "cash total");
assert(totals.cardTotal === 25500, "card total");
assert(totals.transferTotal === 4501, "transfer total");
assert(totals.totalSales === 46001, "total sales");

const summary = buildSessionSummary(100000, purchases);
assert(summary.expectedCash === 116000, "expected cash");

const variance = computeCashVariance(116000, 115250.4);
assert(variance === -750, "variance");

const merged = sumPaymentTotals([
  totals,
  { purchaseCount: 2, totalSales: 20000, cashTotal: 20000, cardTotal: 0, transferTotal: 0 },
]);
assert(merged.purchaseCount === 6, "merged count");
assert(merged.totalSales === 66001, "merged sales");

const splitSale = {
  total: 12000,
  paymentType: "cash" as const,
  cashAmount: 5000,
  cardAmount: 0,
  transferAmount: 7000,
};
const splitTotals = aggregatePurchases([splitSale]);
assert(splitTotals.purchaseCount === 1, "split still counts as one sale");
assert(splitTotals.cashTotal === 5000, "split cash");
assert(splitTotals.transferTotal === 7000, "split transfer");
assert(splitTotals.totalSales === 12000, "split total");
assert(transferPortion(splitSale) === 7000, "transfer validation uses only the transfer amount");

const pair = resolveTender({
  total: 12000,
  selected: ["cash", "card"],
  typed: { cash: 5000 },
  drivenBy: "cash",
});
assert(pair.ready, "two methods are ready after cash is entered");
assert(pair.autoType === "card", "the other method completes itself");
assert(pair.lines.find((line) => line.type === "card")?.amount === 7000, "card remainder");

const single = resolveTender({
  total: 12000,
  selected: ["cash"],
  typed: {},
  drivenBy: null,
});
assert(single.ready && single.lines[0]?.amount === 12000, "one method takes the whole total");

const stored = columnsForPayments(12000, pair.lines);
assert(stored?.cashAmount === 5000 && stored.transferAmount === 0 && stored.cardAmount === 7000, "stored amounts");
assert(paymentShares({ total: 8000, paymentType: "card" }).length === 1, "legacy sale without amount columns");

console.log("register reconciliation checks passed");
