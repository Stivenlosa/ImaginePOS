export type BusinessDayStatus = "open" | "closed";
export type RegisterSessionStatus = "open" | "closed";

export type PaymentTotals = {
  purchaseCount: number;
  totalSales: number;
  cashTotal: number;
  cardTotal: number;
  transferTotal: number;
};

export type RegisterSessionSummary = PaymentTotals & {
  openingFloat: number;
  expectedCash: number;
};

export type PublicRegister = {
  id: number;
  number: number;
  name: string | null;
  active: boolean;
};
