"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { useTranslation } from "@/i18n";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/money";
import type { PublicBankTransfer } from "@/lib/bank-transfer-store";
import { PreviewIcon } from "./icons";

const stickyHead = "sticky top-0 z-10 bg-[#F7F9FC] dark:bg-dark-2";

export function BankTransferTable({
  transfers,
  className,
}: {
  transfers: PublicBankTransfer[];
  className?: string;
}) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<PublicBankTransfer | null>(null);

  return (
    <div
      className={cn(
        "flex h-[32rem] flex-col overflow-hidden rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5",
        className,
      )}
    >
      <h2 className="mb-4 shrink-0 text-lg font-semibold text-dark dark:text-white">
        {t("transfers.title")}
      </h2>
      <Table containerClassName="min-h-0 flex-1" className="border-separate border-spacing-0">
        <TableHeader className="sticky top-0 z-10">
          <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-4 [&>th]:text-base [&>th]:text-dark [&>th]:dark:text-white">
            <TableHead className={stickyHead}>{t("transfers.payer")}</TableHead>
            <TableHead className={stickyHead}>{t("transfers.amount")}</TableHead>
            <TableHead className={cn("text-right", stickyHead)}>{t("transfers.details")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transfers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="py-8 text-center text-gray-500">
                {t("transfers.empty")}
              </TableCell>
            </TableRow>
          ) : (
            transfers.map((transfer) => (
              <TableRow key={transfer.id} className="border-[#eee] dark:border-dark-3">
                <TableCell>
                  <p className="font-medium text-dark dark:text-white">{transfer.payerName}</p>
                  <p className="text-xs text-gray-500">
                    {dayjs(transfer.occurredAt).format("MMM DD, hh:mm A")}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="text-dark dark:text-white">{formatMoney(transfer.amount)}</p>
                  <div className="mt-1">
                    <StatusBadge status={transfer.transferStatus} />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <button
                    type="button"
                    className="hover:text-primary"
                    onClick={() => setSelected(transfer)}
                    title={t("transfers.details")}
                  >
                    <span className="sr-only">{t("transfers.details")}</span>
                    <PreviewIcon />
                  </button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {selected && <TransferDetailsModal transfer={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function TransferDetailsModal({
  transfer,
  onClose,
}: {
  transfer: PublicBankTransfer;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const rows = [
    [t("transfers.when"), dayjs(transfer.occurredAt).format("MMM DD, YYYY hh:mm A")],
    [t("transfers.payer"), transfer.payerName],
    [t("transfers.amount"), formatMoney(transfer.amount)],
    [t("transfers.account"), `*${transfer.account}`],
    [t("transfers.llave"), transfer.llave],
    [t("transfers.purchase"), transfer.orderNumber ? `#${transfer.orderNumber}` : "—"],
    [
      t("purchases.validation"),
      t(
        transfer.transferStatus === "validated"
          ? "purchases.validated"
          : "purchases.pending",
      ),
    ],
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="transfer-details-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-gray-dark"
      >
        <h2 id="transfer-details-title" className="text-lg font-bold text-dark dark:text-white">
          {t("transfers.moreInfo")}
        </h2>
        <dl className="mt-4 space-y-3">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-4 text-sm">
              <dt className="text-gray-500">{label}</dt>
              <dd className="text-right font-medium text-dark dark:text-white">{value}</dd>
            </div>
          ))}
        </dl>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-gray-200 py-3 text-gray-700 dark:bg-dark-3 dark:text-dark-6"
        >
          {t("common.close")}
        </button>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: "pending" | "validated" | null }) {
  const { t } = useTranslation();
  const validated = status === "validated";
  return (
    <span
      className={cn(
        "inline-block rounded-full px-3 py-1 text-xs font-medium",
        validated ? "bg-[#219653]/[0.08] text-[#219653]" : "bg-[#F59E0B]/[0.08] text-[#F59E0B]",
      )}
    >
      {t(validated ? "purchases.validated" : "purchases.pending")}
    </span>
  );
}
