"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useTranslation } from "@/i18n";
import { announcePayment } from "@/utils/speech";
import { StatusBadge } from "@/components/tables/bank-transfer-table";
import type { PublicBankTransfer } from "@/lib/bank-transfer-store";

const POLL_MS = 20000;

export function TransferInboxListener() {
  const { t } = useTranslation();
  const [warning, setWarning] = useState("");
  const [recent, setRecent] = useState<PublicBankTransfer[]>([]);

  useEffect(() => {
    let stopped = false;
    let running = false;

    async function listen() {
      if (stopped || running) return;
      running = true;
      try {
        const response = await fetch("/api/transfers/listen", { method: "POST" });
        const data = (await response.json().catch(() => null)) as {
          error?: string;
          payments?: { nombre: string; valor: number }[];
          recent?: PublicBankTransfer[];
        } | null;

        if (stopped) return;
        if (data?.error === "invalid_credentials") {
          setWarning(t("sales.inboxRejected"));
          return;
        }
        if (data?.error) {
          setWarning(t("sales.inboxUnreachable"));
          return;
        }

        setWarning("");
        if (data?.recent) setRecent(data.recent);
        for (const payment of data?.payments ?? []) {
          announcePayment(payment.nombre, payment.valor);
        }
      } catch {
        if (!stopped) setWarning(t("sales.inboxUnreachable"));
      } finally {
        running = false;
      }
    }

    void listen();
    const timer = window.setInterval(() => void listen(), POLL_MS);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [t]);

  return (
    <div className="shrink-0">
      {warning && (
        <p className="mb-3 rounded-lg bg-red-light-6 px-4 py-2 text-sm text-red">{warning}</p>
      )}
      <div className="rounded-xl border border-stroke bg-white px-4 py-3 dark:border-dark-3 dark:bg-gray-dark">
        <h2 className="text-sm font-semibold text-dark dark:text-white">{t("transfers.recent")}</h2>
        {recent.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">{t("transfers.empty")}</p>
        ) : (
          <ul className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {recent.map((transfer) => (
              <li key={transfer.id} className="rounded-lg bg-gray-2 px-3 py-2 dark:bg-dark-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-dark dark:text-white">{transfer.payerName}</p>
                  <StatusBadge status={transfer.transferStatus} />
                </div>
                <p className="text-sm text-dark dark:text-white">${transfer.amount.toFixed(2)}</p>
                <p className="text-xs text-gray-500">
                  {dayjs(transfer.occurredAt).format("MMM DD, hh:mm A")} · {transfer.llave}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
