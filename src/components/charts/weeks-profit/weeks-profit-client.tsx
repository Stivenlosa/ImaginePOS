"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import { WeeksProfitChart } from "./chart";
import dayjs from "dayjs";
import type { PaymentType, SaleUnit } from "@/types/product";

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

type Purchase = {
  id: number;
  orderNumber: string;
  subtotal: number;
  tax: number;
  total: number;
  paymentType: PaymentType;
  createdAt: string;
  updatedAt: string;
  details: PurchaseDetail[];
};

export type WeeksProfitData = {
  cash: { x: string; y: number }[];
  card: { x: string; y: number }[];
  transfer: { x: string; y: number }[];
  dayDates: string[];
  dayNames: string[];
  purchasesByDay: Record<string, Purchase[]>;
  weekStart: string;
  weekEnd: string;
};

type WeeksProfitClientProps = {
  data: WeeksProfitData;
  className?: string;
};

const PAYMENT_TYPE_STYLES: Record<
  PaymentType,
  { bg: string; text: string; label: string }
> = {
  cash: { bg: "bg-[#219653]/[0.08]", text: "text-[#219653]", label: "paymentTypes.cash" },
  card: { bg: "bg-[#3C50E0]/[0.08]", text: "text-[#3C50E0]", label: "paymentTypes.card" },
  transfer: { bg: "bg-[#F59E0B]/[0.08]", text: "text-[#F59E0B]", label: "paymentTypes.transfer" },
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

// Day Summary Modal
function DaySummaryModal({
  date,
  dayName,
  purchases,
  onClose,
  t,
}: {
  date: string;
  dayName: string;
  purchases: Purchase[];
  onClose: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const totalCash = purchases
    .filter((p) => p.paymentType === "cash")
    .reduce((sum, p) => sum + p.total, 0);
  const totalCard = purchases
    .filter((p) => p.paymentType === "card")
    .reduce((sum, p) => sum + p.total, 0);
  const totalTransfer = purchases
    .filter((p) => p.paymentType === "transfer")
    .reduce((sum, p) => sum + p.total, 0);
  const grandTotal = totalCash + totalCard + totalTransfer;

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const styles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; padding: 20px; max-width: 350px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 15px; border-bottom: 2px dashed #000; padding-bottom: 12px; }
        .header h1 { font-size: 22px; margin-bottom: 4px; }
        .header p { font-size: 12px; color: #666; }
        .summary-section { margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px dashed #000; }
        .summary-row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 13px; }
        .summary-row.total { font-size: 16px; font-weight: bold; border-top: 1px solid #000; padding-top: 8px; margin-top: 8px; }
        .purchase-item { margin: 10px 0; padding: 8px 0; border-bottom: 1px dotted #ccc; }
        .purchase-header { display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; }
        .purchase-detail { font-size: 11px; color: #666; margin: 2px 0; }
        .payment-badge { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 10px; background: #eee; }
        .footer { text-align: center; margin-top: 15px; padding-top: 12px; border-top: 2px dashed #000; font-size: 12px; color: #666; }
        @media print { body { padding: 0; } }
      </style>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Daily Summary - ${dayjs(date).format("MMM DD, YYYY")}</title>
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
              {t("weeklyProfit.daySummary")} - {dayName}
            </h2>
            <p className="text-sm text-green-100">
              {dayjs(date).format("MMMM DD, YYYY")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition"
          >
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div ref={receiptRef}>
            {/* Store Header (for print) */}
            <div className="header text-center border-b-2 border-dashed border-gray-300 dark:border-dark-4 pb-4 mb-4">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                ImaginePOS
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("weeklyProfit.daySummary")} - {dayjs(date).format("MMMM DD, YYYY")}
              </p>
            </div>

            {/* Payment Summary */}
            <div className="summary-section border-b border-dashed border-gray-300 dark:border-dark-4 pb-4 mb-4">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
                {t("weeklyProfit.paymentSummary")}
              </h3>
              <div className="space-y-2">
                <div className="summary-row flex justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <span className="inline-block w-3 h-3 rounded-full bg-[#219653]" />
                    {t("paymentTypes.cash")}
                  </span>
                  <span className="font-medium text-gray-800 dark:text-white">
                    ${totalCash.toFixed(2)}
                  </span>
                </div>
                <div className="summary-row flex justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <span className="inline-block w-3 h-3 rounded-full bg-[#3C50E0]" />
                    {t("paymentTypes.card")}
                  </span>
                  <span className="font-medium text-gray-800 dark:text-white">
                    ${totalCard.toFixed(2)}
                  </span>
                </div>
                <div className="summary-row flex justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <span className="inline-block w-3 h-3 rounded-full bg-[#F59E0B]" />
                    {t("paymentTypes.transfer")}
                  </span>
                  <span className="font-medium text-gray-800 dark:text-white">
                    ${totalTransfer.toFixed(2)}
                  </span>
                </div>
                <div className="summary-row total flex justify-between text-base font-bold border-t border-gray-300 dark:border-dark-4 pt-3 mt-3">
                  <span className="text-gray-800 dark:text-white">
                    {t("common.total")}
                  </span>
                  <span className="text-green-600">${grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer (for print) */}
            <div className="footer text-center mt-4 pt-3 border-t-2 border-dashed border-gray-300 dark:border-dark-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("weeklyProfit.generatedAt")}: {dayjs().format("MMM DD, YYYY hh:mm A")}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 border-t dark:border-dark-4 bg-gray-50 dark:bg-dark-2 flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9V2h12v7" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            {t("weeklyProfit.printSummary")}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-200 dark:bg-dark-3 text-gray-700 dark:text-dark-6 rounded-xl hover:bg-gray-300 dark:hover:bg-dark-4 transition"
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function WeeksProfitClient({ data, className }: WeeksProfitClientProps) {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const { t } = useTranslation();

  const handleDayClick = (dayIndex: number) => {
    setSelectedDayIndex(dayIndex);
  };

  const selectedDate = selectedDayIndex !== null ? data.dayDates[selectedDayIndex] : null;
  const selectedDayName = selectedDayIndex !== null ? data.dayNames[selectedDayIndex] : "";
  const selectedPurchases = selectedDate ? data.purchasesByDay[selectedDate] || [] : [];

  const weekStartFormatted = dayjs(data.weekStart).format("MMM DD");
  const weekEndFormatted = dayjs(data.weekEnd).subtract(1, "day").format("MMM DD, YYYY");

  return (
    <div
      className={cn(
        "rounded-[10px] bg-white px-7.5 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-body-2xlg font-bold text-dark dark:text-white">
          {t("weeklyProfit.title")}
        </h2>
        <span className="text-sm font-medium text-gray-500 dark:text-dark-6">
          {weekStartFormatted} - {weekEndFormatted}
        </span>
      </div>

      <p className="mt-1 text-sm text-gray-500 dark:text-dark-6">
        {t("weeklyProfit.clickDay")}
      </p>

      <WeeksProfitChart
        data={{
          cash: data.cash,
          card: data.card,
          transfer: data.transfer,
        }}
        onDayClick={handleDayClick}
        seriesLabels={{
          cash: t("paymentTypes.cash"),
          card: t("paymentTypes.card"),
          transfer: t("paymentTypes.transfer"),
        }}
      />

      {/* Day Summary Modal */}
      {selectedDayIndex !== null && selectedDate && (
        <DaySummaryModal
          date={selectedDate}
          dayName={selectedDayName}
          purchases={selectedPurchases}
          onClose={() => setSelectedDayIndex(null)}
          t={t}
        />
      )}
    </div>
  );
}
