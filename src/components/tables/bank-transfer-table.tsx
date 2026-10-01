"use client";

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
import type { PublicBankTransfer } from "@/lib/bank-transfer-store";

export function BankTransferTable({ transfers }: { transfers: PublicBankTransfer[] }) {
  const { t } = useTranslation();

  return (
    <div className="col-span-12 rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
      <h2 className="mb-4 text-lg font-semibold text-dark dark:text-white">{t("transfers.title")}</h2>
      <Table>
        <TableHeader>
          <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-4 [&>th]:text-base [&>th]:text-dark [&>th]:dark:text-white">
            <TableHead>{t("transfers.when")}</TableHead>
            <TableHead>{t("transfers.payer")}</TableHead>
            <TableHead>{t("transfers.amount")}</TableHead>
            <TableHead>{t("transfers.account")}</TableHead>
            <TableHead>{t("transfers.llave")}</TableHead>
            <TableHead>{t("transfers.purchase")}</TableHead>
            <TableHead>{t("purchases.validation")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transfers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                {t("transfers.empty")}
              </TableCell>
            </TableRow>
          ) : (
            transfers.map((transfer) => (
              <TableRow key={transfer.id} className="border-[#eee] dark:border-dark-3">
                <TableCell>
                  <p className="text-dark dark:text-white">{dayjs(transfer.occurredAt).format("MMM DD, YYYY")}</p>
                  <p className="text-xs text-gray-500">{dayjs(transfer.occurredAt).format("hh:mm A")}</p>
                </TableCell>
                <TableCell className="font-medium text-dark dark:text-white">{transfer.payerName}</TableCell>
                <TableCell>${transfer.amount.toFixed(2)}</TableCell>
                <TableCell>*{transfer.account}</TableCell>
                <TableCell>{transfer.llave}</TableCell>
                <TableCell>{transfer.orderNumber ? `#${transfer.orderNumber}` : "—"}</TableCell>
                <TableCell>
                  <StatusBadge status={transfer.transferStatus} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
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
