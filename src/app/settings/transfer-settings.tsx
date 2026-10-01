"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "@/i18n";

type TransferConfig = {
  gmailAddress: string;
  llave: string;
  timeWindowMinutes: number;
  passwordSet: boolean;
};

export function TransferSettings() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [passwordSet, setPasswordSet] = useState(false);
  const [gmailAddress, setGmailAddress] = useState("");
  const [gmailAppPassword, setGmailAppPassword] = useState("");
  const [llave, setLlave] = useState("");
  const [timeWindowMinutes, setTimeWindowMinutes] = useState("60");

  const loadConfig = useCallback(async () => {
    const response = await fetch("/api/settings/transfer");
    if (!response.ok) {
      setError(t("common.error"));
      setLoading(false);
      return;
    }
    const data = (await response.json()) as { config: TransferConfig | null };
    if (data.config) {
      setGmailAddress(data.config.gmailAddress);
      setLlave(data.config.llave);
      setTimeWindowMinutes(String(data.config.timeWindowMinutes));
      setPasswordSet(data.config.passwordSet);
    }
    setLoading(false);
  }, [t]);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  function errorText(code: string) {
    const key = `settings.transfer.errors.${code}`;
    const message = t(key);
    return message === key ? t("common.error") : message;
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    const response = await fetch("/api/settings/transfer", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gmailAddress,
        llave,
        timeWindowMinutes: Number(timeWindowMinutes),
        ...(gmailAppPassword ? { gmailAppPassword } : {}),
      }),
    });

    setSaving(false);
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(errorText(data?.error ?? ""));
      return;
    }

    const data = (await response.json()) as { config: TransferConfig };
    setGmailAddress(data.config.gmailAddress);
    setLlave(data.config.llave);
    setTimeWindowMinutes(String(data.config.timeWindowMinutes));
    setPasswordSet(data.config.passwordSet);
    setGmailAppPassword("");
    setSaved(true);
  }

  return (
    <section className="rounded-xl border border-stroke bg-white p-5 shadow-card-2 dark:border-dark-3 dark:bg-gray-dark">
      <h2 className="text-lg font-semibold text-dark dark:text-white">{t("settings.transfer.title")}</h2>
      <p className="mt-1 text-sm text-gray-6">{t("settings.transfer.subtitle")}</p>

      {loading ? (
        <p className="mt-4 text-sm text-gray-6">{t("common.loading")}</p>
      ) : (
        <form onSubmit={save} className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-gray-6">
            {t("settings.transfer.email")}
            <input
              type="email"
              value={gmailAddress}
              onChange={(event) => setGmailAddress(event.target.value)}
              placeholder="caja@gmail.com"
              autoComplete="off"
              required
              className="rounded border px-3 py-2 text-dark dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-6">
            {t("settings.transfer.password")}
            <input
              type="password"
              value={gmailAppPassword}
              onChange={(event) => setGmailAppPassword(event.target.value)}
              placeholder={passwordSet ? t("settings.transfer.passwordHint") : ""}
              autoComplete="new-password"
              required={!passwordSet}
              className="rounded border px-3 py-2 text-dark dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-6">
            {t("settings.transfer.llave")}
            <input
              value={llave}
              onChange={(event) => setLlave(event.target.value)}
              placeholder="@jordan751"
              required
              className="rounded border px-3 py-2 text-dark dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-6">
            {t("settings.transfer.window")}
            <input
              type="number"
              min={5}
              max={240}
              value={timeWindowMinutes}
              onChange={(event) => setTimeWindowMinutes(event.target.value)}
              required
              className="rounded border px-3 py-2 text-dark dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </label>
          <p className="text-sm text-gray-6 md:col-span-2">{t("settings.transfer.help")}</p>
          {error && <p className="text-sm text-red md:col-span-2">{error}</p>}
          {saved && <p className="text-sm text-green-dark md:col-span-2">{t("settings.transfer.saved")}</p>}
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? t("common.saving") : t("common.save")}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
