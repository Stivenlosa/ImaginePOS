"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";
import { UserInfo } from "@/components/header/user-info";
import { formatMoney, formatMoneyInput } from "@/lib/money";
import { useTranslation } from "@/i18n";
import type { PublicUser } from "@/types/user";

type RegisterRow = {
  id: number;
  number: number;
  name: string | null;
  active: boolean;
};

type BusinessDayPayload = {
  id: number;
  businessDate: string;
  status: "open" | "closed";
};

type SessionRow = {
  id: number;
  status: "open" | "closed";
  openingFloat: number;
  register: RegisterRow;
  cashier: { id: number; name: string; username: string };
  closeSnapshot: {
    purchaseCount: number;
    totalSales: number;
    cashTotal: number;
    cardTotal: number;
    transferTotal: number;
    expectedCash: number;
    countedCash?: number;
    cashVariance?: number;
  } | null;
};

export function RegistersClient() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, ready } = useAuth();
  const [registers, setRegisters] = useState<RegisterRow[]>([]);
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [openDay, setOpenDay] = useState<BusinessDayPayload | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [newRegisterNumber, setNewRegisterNumber] = useState("");
  const [newRegisterName, setNewRegisterName] = useState("");
  const [openRegisterId, setOpenRegisterId] = useState<number | "">("");
  const [openCashierId, setOpenCashierId] = useState<number | "">("");
  const [openingFloat, setOpeningFloat] = useState("0");
  const [closeSessionId, setCloseSessionId] = useState<number | "">("");
  const [countedCash, setCountedCash] = useState("");

  const cashiers = useMemo(
    () => users.filter((row) => row.active && row.role === "cajero"),
    [users],
  );

  const openSessions = useMemo(() => sessions.filter((session) => session.status === "open"), [sessions]);

  const load = useCallback(async () => {
    setError("");
    const [registersRes, usersRes, dayRes] = await Promise.all([
      fetch("/api/registers"),
      fetch("/api/users"),
      fetch("/api/business-day"),
    ]);

    if ([registersRes, usersRes].some((response) => response.status === 403)) {
      router.replace("/");
      return;
    }

    if (!registersRes.ok || !usersRes.ok || !dayRes.ok) {
      setError(t("common.error"));
      setLoading(false);
      return;
    }

    setRegisters((await registersRes.json()) as RegisterRow[]);
    setUsers((await usersRes.json()) as PublicUser[]);

    const dayPayload = (await dayRes.json()) as {
      openDay: BusinessDayPayload | null;
      sessions: SessionRow[];
    };
    setOpenDay(dayPayload.openDay);
    setSessions(dayPayload.sessions);
    setLoading(false);
  }, [router, t]);

  useEffect(() => {
    if (!ready) return;
    if (user?.role !== "administrador") {
      router.replace("/");
      return;
    }
    void load();
  }, [ready, user, router, load]);

  const refreshDay = async () => {
    const response = await fetch("/api/business-day");
    if (!response.ok) return;
    const dayPayload = (await response.json()) as {
      openDay: BusinessDayPayload | null;
      sessions: SessionRow[];
    };
    setOpenDay(dayPayload.openDay);
    setSessions(dayPayload.sessions);
  };

  const handleOpenDay = async () => {
    setBusy(true);
    setMessage("");
    setError("");
    const response = await fetch("/api/business-day", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const payload = (await response.json().catch(() => null)) as {
      code?: string;
      businessDate?: string;
      reopened?: boolean;
    } | null;
    if (!response.ok) {
      const code = payload?.code;
      setError(
        code === "BUSINESS_DAY_ALREADY_OPEN"
          ? t("registers.dayAlreadyOpen")
          : t("registers.openDayFailed"),
      );
      setBusy(false);
      return;
    }
    setMessage(
      payload?.reopened
        ? t("registers.dayReopened", { date: payload.businessDate ?? "" })
        : t("registers.dayOpened", { date: payload?.businessDate ?? "" }),
    );
    await refreshDay();
    setBusy(false);
  };

  const handleCloseDay = async () => {
    if (!window.confirm(t("registers.confirmCloseDay"))) return;
    setBusy(true);
    setMessage("");
    setError("");
    const response = await fetch("/api/business-day/close", { method: "POST" });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setError(payload?.error ?? t("common.error"));
      setBusy(false);
      return;
    }
    setMessage(t("registers.dayClosed"));
    await refreshDay();
    setBusy(false);
  };

  const handleCreateRegister = async () => {
    const number = Number(newRegisterNumber);
    if (!Number.isInteger(number) || number < 1) {
      setError(t("registers.invalidRegisterNumber"));
      return;
    }
    setBusy(true);
    setError("");
    const response = await fetch("/api/registers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number, name: newRegisterName.trim() || undefined }),
    });
    if (!response.ok) {
      setError(t("common.error"));
      setBusy(false);
      return;
    }
    setNewRegisterNumber("");
    setNewRegisterName("");
    await load();
    setBusy(false);
  };

  const handleOpenSession = async () => {
    if (openRegisterId === "" || openCashierId === "") {
      setError(t("registers.missingOpenFields"));
      return;
    }
    const floatValue = Number(openingFloat);
    if (!Number.isFinite(floatValue) || floatValue < 0) {
      setError(t("registers.invalidOpeningFloat"));
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");
    const response = await fetch("/api/register-sessions/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        registerId: openRegisterId,
        cashierUserId: openCashierId,
        openingFloat: floatValue,
      }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setError(payload?.error ?? t("common.error"));
      setBusy(false);
      return;
    }
    setMessage(t("registers.sessionOpened"));
    await refreshDay();
    setBusy(false);
  };

  const handleCloseSession = async () => {
    if (closeSessionId === "") {
      setError(t("registers.selectSessionToClose"));
      return;
    }
    const counted = Number(countedCash);
    if (!Number.isFinite(counted) || counted < 0) {
      setError(t("registers.invalidCountedCash"));
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");
    const response = await fetch("/api/register-sessions/close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: closeSessionId, countedCash: counted }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setError(payload?.error ?? t("common.error"));
      setBusy(false);
      return;
    }
    setMessage(t("registers.sessionClosed"));
    setCloseSessionId("");
    setCountedCash("");
    await refreshDay();
    setBusy(false);
  };

  const fillExpectedCash = () => {
    const session = openSessions.find((row) => row.id === closeSessionId);
    if (!session?.closeSnapshot) return;
    setCountedCash(formatMoneyInput(session.closeSnapshot.expectedCash));
  };

  if (!ready || loading) {
    return (
      <div className="p-6">
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("registers.title")}</h1>
          <p className="text-sm text-gray-500 dark:text-dark-5">{t("registers.subtitle")}</p>
        </div>
        <UserInfo />
      </div>

      {(message || error) && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            error
              ? "border border-red-200 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-100"
              : "border border-green-200 bg-green-50 text-green-800 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-100"
          }`}
        >
          {error || message}
        </div>
      )}

      <section className="rounded-2xl border border-stroke bg-white p-6 dark:border-dark-3 dark:bg-gray-dark">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{t("registers.businessDay")}</h2>
            <p className="text-sm text-gray-500 dark:text-dark-5">
              {openDay
                ? t("registers.openDayLabel", { date: openDay.businessDate })
                : t("registers.noOpenDay")}
            </p>
          </div>
          <div className="flex gap-2">
            {!openDay && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleOpenDay()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {t("registers.openDay")}
              </button>
            )}
            {openDay && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleCloseDay()}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {t("registers.closeDay")}
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-stroke bg-white p-6 dark:border-dark-3 dark:bg-gray-dark">
          <h2 className="mb-4 text-lg font-semibold">{t("registers.configureRegisters")}</h2>
          <div className="mb-4 space-y-2">
            {registers.length === 0 ? (
              <p className="text-sm text-gray-500">{t("registers.noRegisters")}</p>
            ) : (
              registers.map((register) => (
                <div key={register.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-dark-2">
                  <span>
                    {register.name?.trim() || t("registers.registerNumber", { number: register.number })}
                  </span>
                  <span className="text-xs uppercase tracking-wide text-gray-500">
                    {register.active ? t("settings.active") : t("settings.inactive")}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              type="number"
              min={1}
              value={newRegisterNumber}
              onChange={(event) => setNewRegisterNumber(event.target.value)}
              placeholder={t("registers.numberPlaceholder")}
              className="rounded-lg border px-3 py-2 dark:border-dark-3 dark:bg-dark-2"
            />
            <input
              value={newRegisterName}
              onChange={(event) => setNewRegisterName(event.target.value)}
              placeholder={t("registers.namePlaceholder")}
              className="rounded-lg border px-3 py-2 dark:border-dark-3 dark:bg-dark-2"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleCreateRegister()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {t("registers.addRegister")}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-stroke bg-white p-6 dark:border-dark-3 dark:bg-gray-dark">
          <h2 className="mb-4 text-lg font-semibold">{t("registers.openSession")}</h2>
          <div className="grid gap-3">
            <select
              value={openRegisterId}
              onChange={(event) => setOpenRegisterId(event.target.value ? Number(event.target.value) : "")}
              className="rounded-lg border px-3 py-2 dark:border-dark-3 dark:bg-dark-2"
            >
              <option value="">{t("registers.selectRegister")}</option>
              {registers.filter((register) => register.active).map((register) => (
                <option key={register.id} value={register.id}>
                  {register.name?.trim() || t("registers.registerNumber", { number: register.number })}
                </option>
              ))}
            </select>
            <select
              value={openCashierId}
              onChange={(event) => setOpenCashierId(event.target.value ? Number(event.target.value) : "")}
              className="rounded-lg border px-3 py-2 dark:border-dark-3 dark:bg-dark-2"
            >
              <option value="">{t("registers.selectCashier")}</option>
              {cashiers.map((cashier) => (
                <option key={cashier.id} value={cashier.id}>
                  {cashier.name} ({cashier.username})
                </option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              step="1"
              value={openingFloat}
              onChange={(event) => setOpeningFloat(event.target.value)}
              placeholder={t("registers.openingFloat")}
              className="rounded-lg border px-3 py-2 dark:border-dark-3 dark:bg-dark-2"
            />
            <button
              type="button"
              disabled={busy || !openDay}
              onClick={() => void handleOpenSession()}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {t("registers.openSessionAction")}
            </button>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-stroke bg-white p-6 dark:border-dark-3 dark:bg-gray-dark">
        <h2 className="mb-4 text-lg font-semibold">{t("registers.sessionsToday")}</h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-gray-500">{t("registers.noSessions")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b dark:border-dark-3">
                  <th className="px-3 py-2 text-left">{t("registers.register")}</th>
                  <th className="px-3 py-2 text-left">{t("registers.cashier")}</th>
                  <th className="px-3 py-2 text-left">{t("settings.status")}</th>
                  <th className="px-3 py-2 text-right">{t("common.total")}</th>
                  <th className="px-3 py-2 text-right">{t("paymentTypes.cash")}</th>
                  <th className="px-3 py-2 text-right">{t("registers.expectedCash")}</th>
                  <th className="px-3 py-2 text-right">{t("registers.variance")}</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id} className="border-b dark:border-dark-3">
                    <td className="px-3 py-2">
                      {session.register.name?.trim() ||
                        t("registers.registerNumber", { number: session.register.number })}
                    </td>
                    <td className="px-3 py-2">{session.cashier.name}</td>
                    <td className="px-3 py-2 capitalize">{session.status}</td>
                    <td className="px-3 py-2 text-right">
                      {formatMoney(session.closeSnapshot?.totalSales ?? 0)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {formatMoney(session.closeSnapshot?.cashTotal ?? 0)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {formatMoney(session.closeSnapshot?.expectedCash ?? session.openingFloat)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {session.closeSnapshot?.cashVariance != null
                        ? formatMoney(session.closeSnapshot.cashVariance)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-stroke bg-white p-6 dark:border-dark-3 dark:bg-gray-dark">
        <h2 className="mb-4 text-lg font-semibold">{t("registers.closeSession")}</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <select
            value={closeSessionId}
            onChange={(event) => setCloseSessionId(event.target.value ? Number(event.target.value) : "")}
            className="rounded-lg border px-3 py-2 dark:border-dark-3 dark:bg-dark-2"
          >
            <option value="">{t("registers.selectOpenSession")}</option>
            {openSessions.map((session) => (
              <option key={session.id} value={session.id}>
                {(session.register.name?.trim() ||
                  t("registers.registerNumber", { number: session.register.number })) +
                  ` — ${session.cashier.name}`}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            step="1"
            value={countedCash}
            onChange={(event) => setCountedCash(event.target.value)}
            placeholder={t("registers.countedCash")}
            className="rounded-lg border px-3 py-2 dark:border-dark-3 dark:bg-dark-2"
          />
          <button
            type="button"
            onClick={fillExpectedCash}
            className="rounded-lg border px-4 py-2 text-sm dark:border-dark-3"
          >
            {t("registers.useExpectedCash")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleCloseSession()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {t("registers.closeSessionAction")}
          </button>
        </div>
      </section>
    </div>
  );
}
