import { cn } from "@/lib/utils";
import { InvoiceTableClient } from "./invoice-table-client";
import { timestampToIso } from "@/prisma/dates";
import type { PaymentType, SaleUnit } from "@/types/product";

type PurchaseFromDB = {
  id: number;
  orderNumber: string;
  subtotal: number;
  tax: number;
  total: number;
  paymentType: PaymentType;
  transferStatus: "pending" | "validated" | null;
  payerName: string | null;
  validatedAt: Temporal.PlainDateTime | null;
  bankTransfer: {
    payerName: string;
    amount: number;
    account: string;
    llave: string;
    occurredAt: Temporal.PlainDateTime;
  } | null;
  createdAt: Temporal.PlainDateTime;
  updatedAt: Temporal.PlainDateTime;
  details: {
    id: number;
    purchaseId: number;
    productId: number;
    productName: string;
    price: number;
    quantity: number;
    weight: number | null;
    saleUnit: SaleUnit;
    lineTotal: number;
    createdAt: Temporal.PlainDateTime;
  }[];
};

type InvoiceTableProps = {
  className?: string;
  purchases: PurchaseFromDB[];
};

export function InvoiceTable({ className, purchases }: InvoiceTableProps) {
  // Serialize dates to strings for client component
  const serializedPurchases = purchases.map((p) => ({
    ...p,
    createdAt: timestampToIso(p.createdAt),
    updatedAt: timestampToIso(p.updatedAt),
    validatedAt: p.validatedAt ? timestampToIso(p.validatedAt) : null,
    bankTransfer: p.bankTransfer
      ? {
          payerName: p.bankTransfer.payerName,
          amount: p.bankTransfer.amount,
          account: p.bankTransfer.account,
          llave: p.bankTransfer.llave,
          occurredAt: timestampToIso(p.bankTransfer.occurredAt),
        }
      : null,
    details: p.details.map((d) => ({
      ...d,
      createdAt: timestampToIso(d.createdAt),
    })),
  }));

  return (
    <div
      className={cn(
        "flex h-[32rem] flex-col overflow-hidden rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5",
        className
      )}
    >
      <InvoiceTableClient purchases={serializedPurchases} />
    </div>
  );
}
