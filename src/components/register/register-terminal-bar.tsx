"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-context";
import { formatMoney } from "@/lib/money";
import { useTranslation } from "@/i18n";

type RegisterSessionPayload = {
  id: number;
  status: "open" | "closed";
  openingFloat: number;
  register: { id: number; number: number; name: string | null };
  businessDay: { businessDate: string };
  cashier: { id: number; name: string; username: string };
  closeSnapshot: {
    purchaseCount: number;
    totalSales: number;
    cashTotal: number;
    cardTotal: number;
    transferTotal: number;
    expectedCash: number;
  } | null;
};

export function RegisterTerminalBar() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [session, setSession] = useState<RegisterSessionPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const response = await fetch("/api/register-sessions/current");
    if (!response.ok) {
      setSession(null);
      setLoading(false);
      return;
    }
    const data = (await response.json()) as { session: RegisterSessionPayload | null };
    setSession(data.session);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 30_000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) {
    return (
      <div className="shrink-0 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
        {t("registers.loadingTerminal")}
      </div>
    );
  }

  if (!session) {
    return (
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-100">
        <p>{t("registers.noOpenSession")}</p>
        {user?.role === "administrador" && (
          <Link
            href="/registers"
            className="rounded-lg bg-red-600 px-3 py-1.5 font-medium text-white hover:bg-red-500"
          >
            {t("registers.openRegisterAction")}
          </Link>
        )}
      </div>
    );
  }

  const label = session.register.name?.trim() || t("registers.registerNumber", { number: session.register.number });

  return (
    <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-950 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-100">
      <div>
        <p className="font-semibold">
          {label} — {session.cashier.name}
        </p>
        <p className="text-xs opacity-80">
          {t("registers.businessDate", { date: session.businessDay.businessDate })}
          {session.closeSnapshot
            ? ` · ${t("registers.liveSales", {
                count: session.closeSnapshot.purchaseCount,
                total: formatMoney(session.closeSnapshot.totalSales),
              })}`
            : null}
        </p>
      </div>
      {user?.role === "administrador" && (
        <Link
          href="/registers"
          className="rounded-lg bg-green-700 px-3 py-1.5 font-medium text-white hover:bg-green-600"
        >
          {t("registers.manageRegisters")}
        </Link>
      )}
    </div>
  );
}
