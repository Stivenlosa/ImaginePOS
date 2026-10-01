"use client";

import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import { useAuth } from "@/components/auth/auth-context";
import { useTranslation } from "@/i18n";
import { CASHIER_RECENT_TRANSFER_LIMIT } from "@/lib/transfer-limits";
import { formatMoney } from "@/lib/money";
import { announcePayment } from "@/utils/speech";
import { StatusBadge } from "@/components/tables/bank-transfer-table";
import type { PublicBankTransfer } from "@/lib/bank-transfer-store";

const POLL_MS = 20000;

export function TransferInboxListener() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [warning, setWarning] = useState("");
  const [recent, setRecent] = useState<PublicBankTransfer[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const visible =
    user?.role === "administrador" ? recent : recent.slice(0, CASHIER_RECENT_TRANSFER_LIMIT);

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

  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      openButtonRef.current?.focus();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const closeModal = () => {
    setIsOpen(false);
    window.requestAnimationFrame(() => openButtonRef.current?.focus());
  };

  return (
    <div className="shrink-0">
      {warning && (
        <p className="mb-3 rounded-lg bg-red-light-6 px-4 py-2 text-sm text-red">{warning}</p>
      )}
      <button
        ref={openButtonRef}
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-dark transition hover:bg-gray-2 dark:border-dark-3 dark:bg-gray-dark dark:text-white dark:hover:bg-dark-2"
        aria-haspopup="dialog"
      >
        {t("transfers.viewRecent")}
        {visible.length > 0 && (
          <span className="rounded-full bg-green-600 px-2 py-0.5 text-xs font-bold text-white">
            {visible.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="recent-transfers-title"
            className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-dark"
          >
            <header className="flex items-center justify-between gap-4 border-b border-stroke px-6 py-4 dark:border-dark-3">
              <h2 id="recent-transfers-title" className="text-lg font-semibold text-dark dark:text-white">
                {t("transfers.recent")}
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeModal}
                className="rounded-lg px-3 py-2 text-gray-500 transition hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-2 dark:hover:text-white"
                aria-label={t("common.close")}
              >
                ✕
              </button>
            </header>

            <div className="overflow-y-auto p-6">
              {visible.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">{t("transfers.empty")}</p>
              ) : (
                <ul className="divide-y divide-stroke dark:divide-dark-3">
                  {visible.map((transfer) => (
                    <li key={transfer.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-dark dark:text-white">
                          {transfer.payerName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {dayjs(transfer.occurredAt).format("MMM DD, hh:mm A")} · {transfer.llave}
                        </p>
                      </div>
                      <p className="font-semibold text-dark dark:text-white">{formatMoney(transfer.amount)}</p>
                      <StatusBadge status={transfer.transferStatus} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
