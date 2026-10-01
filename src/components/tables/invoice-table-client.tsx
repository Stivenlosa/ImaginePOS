"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import { PreviewIcon, PrinterIcon, CloseIcon } from "./icons";
import { useTranslation } from "@/i18n";
import type { PaymentType, SaleUnit } from "@/types/product";

// Types matching the Prisma schema
type PurchaseDetail = {
  id: number;
  purchaseId: number;
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  weight: number | null;
  saleUnit: SaleUnit;
  lineTotal: number;
  createdAt: string;
};

type TransferStatus = "pending" | "validated";

type Purchase = {
  id: number;
  orderNumber: string;
  subtotal: number;
  tax: number;
  total: number;
  paymentType: PaymentType;
  transferStatus: TransferStatus | null;
  payerName: string | null;
  validatedAt: string | null;
  bankTransfer: {
    payerName: string;
    amount: number;
    account: string;
    llave: string;
    occurredAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  details: PurchaseDetail[];
};

type InvoiceTableClientProps = {
  purchases: Purchase[];
};

const PAYMENT_TYPE_STYLES: Record<PaymentType, { bg: string; text: string; label: string }> = {
  cash: {
    bg: "bg-[#219653]/[0.08]",
    text: "text-[#219653]",
    label: "paymentTypes.cash",
  },
  card: {
    bg: "bg-[#3C50E0]/[0.08]",
    text: "text-[#3C50E0]",
    label: "paymentTypes.card",
  },
  transfer: {
    bg: "bg-[#F59E0B]/[0.08]",
    text: "text-[#F59E0B]",
    label: "paymentTypes.transfer",
  },
};

function getSaleUnitSuffix(unit: SaleUnit): string {
  const suffixes: Record<SaleUnit, string> = {
    unit: "ea",
    kg: "/kg",
    lb: "/lb",
    oz: "/oz",
    g: "/g",
    liter: "/L",
    ml: "/ml",
  };
  return suffixes[unit] || "";
}

function isWeightBasedUnit(unit: SaleUnit): boolean {
  return ["kg", "lb", "oz", "g", "liter", "ml"].includes(unit);
}

// Purchase Detail Modal
function PurchaseDetailModal({
  purchase,
  onClose,
  t,
}: {
  purchase: Purchase;
  onClose: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const status = purchase.paymentType === "transfer"
    ? purchase.transferStatus === "validated"
      ? "validated"
      : "pending"
    : null;

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const styles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Courier New', monospace; 
          padding: 20px;
          max-width: 300px;
          margin: 0 auto;
        }
        .receipt-header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #000; padding-bottom: 15px; }
        .receipt-header h1 { font-size: 24px; margin-bottom: 5px; }
        .receipt-header p { font-size: 12px; color: #666; }
        .order-info { margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px dashed #000; }
        .order-info p { font-size: 12px; margin: 3px 0; }
        .items-section { margin-bottom: 15px; }
        .items-header { font-weight: bold; font-size: 14px; margin-bottom: 10px; }
        .item { display: flex; justify-content: space-between; margin: 8px 0; font-size: 12px; }
        .item-details { flex: 1; }
        .item-name { font-weight: bold; }
        .item-qty { color: #666; font-size: 11px; }
        .item-price { text-align: right; min-width: 60px; }
        .totals { border-top: 2px dashed #000; padding-top: 15px; }
        .total-row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 12px; }
        .total-row.final { font-size: 18px; font-weight: bold; margin-top: 10px; border-top: 1px solid #000; padding-top: 10px; }
        .thank-you { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 2px dashed #000; font-size: 14px; }
        @media print { body { padding: 0; } }
      </style>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${purchase.orderNumber}</title>
        ${styles}
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const paymentStyle = PAYMENT_TYPE_STYLES[purchase.paymentType];

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-gray-dark rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-green-600 text-white p-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">
              {t("purchases.orderNumber", { number: purchase.orderNumber })}
            </h2>
            <p className="text-sm text-green-100">
              {dayjs(purchase.createdAt).format("MMM DD, YYYY - hh:mm A")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div ref={receiptRef} className="receipt-content">
            {/* Store Header */}
            <div className="receipt-header text-center border-b-2 border-dashed border-gray-300 dark:border-dark-4 pb-4 mb-4">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                ImaginePOS
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("checkout.receipt")}
              </p>
            </div>

            {/* Order Info */}
            <div className="order-info border-b border-dashed border-gray-300 dark:border-dark-4 pb-3 mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">
                  {t("purchases.orderNumber", { number: purchase.orderNumber })}
                </span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">{t("checkout.date")}:</span>{" "}
                {dayjs(purchase.createdAt).format("MMM DD, YYYY - hh:mm A")}
              </p>
              {purchase.paymentType === "transfer" && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">{t("purchases.validation")}:</span>{" "}
                  {t(
                    purchase.transferStatus === "validated"
                      ? "purchases.validated"
                      : "purchases.pending",
                  )}
                  {purchase.payerName ? ` · ${purchase.payerName}` : ""}
                </p>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <span className="font-medium">
                  {t("checkout.paymentMethod")}:
                </span>
                <span
                  className={cn(
                    "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                    paymentStyle.bg,
                    paymentStyle.text
                  )}
                >
                  {t(paymentStyle.label)}
                </span>
              </p>
            </div>

            {/* Items */}
            <div className="items-section mb-4">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
                {t("checkout.items")} ({purchase.details.length})
              </h3>
              {purchase.details.map((detail) => (
                <div
                  key={detail.id}
                  className="item flex justify-between py-2 border-b border-gray-100 dark:border-dark-4"
                >
                  <div className="item-details flex-1">
                    <p className="item-name font-medium text-gray-800 dark:text-white">
                      {detail.productName}
                    </p>
                    <p className="item-qty text-xs text-gray-500 dark:text-gray-400">
                      {isWeightBasedUnit(detail.saleUnit) &&
                      detail.weight !== null
                        ? `${detail.weight.toFixed(2)} ${detail.saleUnit} × $${detail.price.toFixed(2)}${getSaleUnitSuffix(detail.saleUnit)}`
                        : `${detail.quantity} × $${detail.price.toFixed(2)}${getSaleUnitSuffix(detail.saleUnit)}`}
                    </p>
                  </div>
                  <p className="item-price font-semibold text-gray-800 dark:text-white">
                    ${detail.lineTotal.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="totals border-t-2 border-dashed border-gray-300 dark:border-dark-4 pt-4">
              <div className="total-row flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>{t("checkout.subtotal")}</span>
                <span>${purchase.subtotal.toFixed(2)}</span>
              </div>
              <div className="total-row flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>{t("checkout.tax")}</span>
                <span>${purchase.tax.toFixed(2)}</span>
              </div>
              <div className="total-row final flex justify-between text-lg font-bold text-gray-800 dark:text-white border-t border-gray-300 dark:border-dark-4 pt-3 mt-2">
                <span>{t("checkout.total")}</span>
                <span className="text-green-600">
                  ${purchase.total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Thank You */}
            <div className="thank-you text-center mt-6 pt-4 border-t-2 border-dashed border-gray-300 dark:border-dark-4">
              <p className="text-gray-600 dark:text-gray-400">
                {t("checkout.thankYou")}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 border-t dark:border-dark-4 bg-gray-50 dark:bg-dark-2 flex gap-3">
          {purchase.paymentType === "transfer" && (
            <button
              onClick={() => setShowTransfer(true)}
              className="flex-1 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-400 transition"
            >
              {t("transfers.view")}
            </button>
          )}
          <button
            onClick={handlePrint}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition flex items-center justify-center gap-2"
          >
            <PrinterIcon className="w-5 h-5" />
            {t("checkout.print")}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-200 dark:bg-dark-3 text-gray-700 dark:text-dark-6 rounded-xl hover:bg-gray-300 dark:hover:bg-dark-4 transition"
          >
            {t("common.close")}
          </button>
        </div>
      </div>
      {showTransfer && status && (
        <TransferInfoModal
          purchase={purchase}
          status={status}
          onClose={() => setShowTransfer(false)}
          t={t}
        />
      )}
    </div>
  );
}

function TransferInfoModal({
  purchase,
  status,
  onClose,
  t,
}: {
  purchase: Purchase;
  status: "pending" | "validated";
  onClose: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const transfer = purchase.bankTransfer;
  const rows = [
    [t("purchases.order"), `#${purchase.orderNumber}`],
    [t("purchases.validation"), t(status === "validated" ? "purchases.validated" : "purchases.pending")],
    [t("transfers.payer"), transfer?.payerName ?? purchase.payerName ?? "—"],
    [t("transfers.amount"), transfer ? `$${transfer.amount.toFixed(2)}` : `$${purchase.total.toFixed(2)}`],
    [t("transfers.account"), transfer ? `*${transfer.account}` : "—"],
    [t("transfers.llave"), transfer?.llave ?? "—"],
    [
      t("transfers.when"),
      transfer ? dayjs(transfer.occurredAt).format("MMM DD, YYYY hh:mm A") : "—",
    ],
    [
      t("transfers.validatedAt"),
      purchase.validatedAt ? dayjs(purchase.validatedAt).format("MMM DD, YYYY hh:mm A") : "—",
    ],
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-gray-dark">
        <h2 className="text-lg font-bold text-dark dark:text-white">{t("transfers.purchaseTitle")}</h2>
        <dl className="mt-4 space-y-3">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-4 text-sm">
              <dt className="text-gray-500">{label}</dt>
              <dd className="text-right font-medium text-dark dark:text-white">{value}</dd>
            </div>
          ))}
        </dl>
        {!transfer && (
          <p className="mt-4 text-sm text-gray-500">{t("transfers.notMatched")}</p>
        )}
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-gray-200 py-3 text-gray-700 dark:bg-dark-3 dark:text-dark-6"
        >
          {t("common.close")}
        </button>
      </div>
    </div>
  );
}

function transferLabel(purchase: Purchase) {
  if (purchase.paymentType !== "transfer") return null;
  return purchase.transferStatus === "validated" ? "validated" : "pending";
}

export function InvoiceTableClient({ purchases }: InvoiceTableClientProps) {
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(
    null
  );
  const [rows, setRows] = useState(purchases);
  const [checking, setChecking] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "administrador";

  useEffect(() => {
    setRows(purchases);
  }, [purchases]);

  async function checkEmails() {
    setChecking(true);
    setNotice("");
    const response = await fetch("/api/transfers/validate", { method: "POST" });
    const data = (await response.json().catch(() => null)) as
      | { configured?: boolean; updated?: number; error?: string }
      | null;
    setChecking(false);

    if (data?.error === "invalid_credentials") {
      setNotice(t("purchases.invalidCredentials"));
      return;
    }
    if (!response.ok || data?.error) {
      setNotice(t("purchases.checkFailed"));
      return;
    }
    if (data?.configured === false) {
      setNotice(t("purchases.notConfigured"));
      return;
    }
    setNotice(t("purchases.checkResult", { count: data?.updated ?? 0 }));
    router.refresh();
  }

  async function setTransferStatus(purchase: Purchase, transferStatus: TransferStatus) {
    setUpdatingId(purchase.id);
    setNotice("");
    const response = await fetch(`/api/purchases/${purchase.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transferStatus }),
    });
    setUpdatingId(null);
    if (!response.ok) {
      setNotice(t("purchases.statusFailed"));
      return;
    }
    const data = (await response.json()) as {
      transferStatus: TransferStatus | null;
      payerName: string | null;
      validatedAt: string | null;
    };
    setRows((current) =>
      current.map((row) =>
        row.id === purchase.id
          ? {
              ...row,
              transferStatus: data.transferStatus,
              payerName: data.payerName,
              validatedAt: data.validatedAt,
            }
          : row,
      ),
    );
    router.refresh();
  }

  const handlePrintDirect = (purchase: Purchase) => {
    const styles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Courier New', monospace; 
          padding: 20px;
          max-width: 300px;
          margin: 0 auto;
        }
        .receipt-header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #000; padding-bottom: 15px; }
        .receipt-header h1 { font-size: 24px; margin-bottom: 5px; }
        .receipt-header p { font-size: 12px; color: #666; }
        .order-info { margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px dashed #000; }
        .order-info p { font-size: 12px; margin: 3px 0; }
        .items-section { margin-bottom: 15px; }
        .items-header { font-weight: bold; font-size: 14px; margin-bottom: 10px; }
        .item { display: flex; justify-content: space-between; margin: 8px 0; font-size: 12px; }
        .item-details { flex: 1; }
        .item-name { font-weight: bold; }
        .item-qty { color: #666; font-size: 11px; }
        .item-price { text-align: right; min-width: 60px; }
        .totals { border-top: 2px dashed #000; padding-top: 15px; }
        .total-row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 12px; }
        .total-row.final { font-size: 18px; font-weight: bold; margin-top: 10px; border-top: 1px solid #000; padding-top: 10px; }
        .thank-you { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 2px dashed #000; font-size: 14px; }
        @media print { body { padding: 0; } }
      </style>
    `;

    const itemsHtml = purchase.details
      .map(
        (detail) => `
      <div class="item">
        <div class="item-details">
          <p class="item-name">${detail.productName}</p>
          <p class="item-qty">${
            isWeightBasedUnit(detail.saleUnit) && detail.weight !== null
              ? `${detail.weight.toFixed(2)} ${detail.saleUnit} × $${detail.price.toFixed(2)}${getSaleUnitSuffix(detail.saleUnit)}`
              : `${detail.quantity} × $${detail.price.toFixed(2)}${getSaleUnitSuffix(detail.saleUnit)}`
          }</p>
        </div>
        <p class="item-price">$${detail.lineTotal.toFixed(2)}</p>
      </div>
    `
      )
      .join("");

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${purchase.orderNumber}</title>
        ${styles}
      </head>
      <body>
        <div class="receipt-header">
          <h1>ImaginePOS</h1>
          <p>Receipt</p>
        </div>
        <div class="order-info">
          <p><strong>Order #${purchase.orderNumber}</strong></p>
          <p>Date: ${dayjs(purchase.createdAt).format("MMM DD, YYYY - hh:mm A")}</p>
          <p>Payment: ${purchase.paymentType.charAt(0).toUpperCase() + purchase.paymentType.slice(1)}</p>
        </div>
        <div class="items-section">
          <p class="items-header">Items</p>
          ${itemsHtml}
        </div>
        <div class="totals">
          <div class="total-row">
            <span>Subtotal</span>
            <span>$${purchase.subtotal.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>Tax</span>
            <span>$${purchase.tax.toFixed(2)}</span>
          </div>
          <div class="total-row final">
            <span>Total</span>
            <span>$${purchase.total.toFixed(2)}</span>
          </div>
        </div>
        <div class="thank-you">
          <p>Thank you for your purchase!</p>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-dark dark:text-white">
            {t("purchases.title")}
          </h2>
          {notice && <p className="mt-1 text-sm text-gray-6">{notice}</p>}
        </div>
        <button
          type="button"
          onClick={() => void checkEmails()}
          disabled={checking}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
        >
          {checking ? t("purchases.checking") : t("purchases.checkEmails")}
        </button>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-4 [&>th]:text-base [&>th]:text-dark [&>th]:dark:text-white">
            <TableHead className="min-w-[140px] xl:pl-7.5">
              {t("purchases.order")}
            </TableHead>
            <TableHead className="min-w-[120px]">
              {t("purchases.date")}
            </TableHead>
            <TableHead>{t("purchases.paymentType")}</TableHead>
            <TableHead>{t("purchases.validation")}</TableHead>
            <TableHead className="text-right">
              {t("purchases.total")}
            </TableHead>
            <TableHead className="text-right xl:pr-7.5">
              {t("purchases.actions")}
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {purchases.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center py-10 text-gray-400 dark:text-dark-5"
              >
                {t("purchases.noPurchases")}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((purchase) => {
              const paymentStyle =
                PAYMENT_TYPE_STYLES[purchase.paymentType];
              return (
                <TableRow
                  key={purchase.id}
                  className="border-[#eee] dark:border-dark-3"
                >
                  <TableCell className="min-w-[140px] xl:pl-7.5">
                    <h5 className="text-dark dark:text-white font-medium">
                      #{purchase.orderNumber}
                    </h5>
                    <p className="mt-[3px] text-body-sm font-medium text-gray-500 dark:text-gray-400">
                      {purchase.details.length}{" "}
                      {purchase.details.length === 1
                        ? t("purchases.item")
                        : t("purchases.items")}
                    </p>
                  </TableCell>

                  <TableCell>
                    <p className="text-dark dark:text-white">
                      {dayjs(purchase.createdAt).format("MMM DD, YYYY")}
                    </p>
                    <p className="mt-[3px] text-body-sm text-gray-500 dark:text-gray-400">
                      {dayjs(purchase.createdAt).format("hh:mm A")}
                    </p>
                  </TableCell>

                  <TableCell>
                    <div
                      className={cn(
                        "max-w-fit rounded-full px-3.5 py-1 text-sm font-medium",
                        paymentStyle.bg,
                        paymentStyle.text
                      )}
                    >
                      {t(paymentStyle.label)}
                    </div>
                  </TableCell>

                  <TableCell>
                    {transferLabel(purchase) ? (
                      <div className="flex flex-col items-start gap-1">
                        <span
                          className={cn(
                            "max-w-fit rounded-full px-3 py-1 text-xs font-medium",
                            transferLabel(purchase) === "validated"
                              ? "bg-[#219653]/[0.08] text-[#219653]"
                              : "bg-[#F59E0B]/[0.08] text-[#F59E0B]",
                          )}
                        >
                          {t(
                            transferLabel(purchase) === "validated"
                              ? "purchases.validated"
                              : "purchases.pending",
                          )}
                        </span>
                        {purchase.payerName && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {purchase.payerName}
                          </span>
                        )}
                        {isAdmin && (
                          <button
                            type="button"
                            disabled={updatingId === purchase.id}
                            onClick={() =>
                              void setTransferStatus(
                                purchase,
                                transferLabel(purchase) === "validated" ? "pending" : "validated",
                              )
                            }
                            className="text-xs text-primary hover:underline disabled:opacity-60"
                          >
                            {transferLabel(purchase) === "validated"
                              ? t("purchases.markPending")
                              : t("purchases.markValidated")}
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <p className="text-dark dark:text-white font-semibold">
                      ${purchase.total.toFixed(2)}
                    </p>
                  </TableCell>

                  <TableCell className="xl:pr-7.5">
                    <div className="flex items-center justify-end gap-x-3.5">
                      <button
                        className="hover:text-primary"
                        onClick={() => setSelectedPurchase(purchase)}
                        title={t("purchases.viewDetails")}
                      >
                        <span className="sr-only">
                          {t("purchases.viewDetails")}
                        </span>
                        <PreviewIcon />
                      </button>

                      <button
                        className="hover:text-primary"
                        onClick={() => handlePrintDirect(purchase)}
                        title={t("purchases.printReceipt")}
                      >
                        <span className="sr-only">
                          {t("purchases.printReceipt")}
                        </span>
                        <PrinterIcon />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Purchase Detail Modal */}
      {selectedPurchase && (
        <PurchaseDetailModal
          purchase={selectedPurchase}
          onClose={() => setSelectedPurchase(null)}
          t={t}
        />
      )}
    </>
  );
}
