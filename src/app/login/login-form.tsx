"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n";
import { useAuth } from "@/components/auth/auth-context";

export function LoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const { refresh } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error === "inactive" ? t("login.inactive") : t("login.invalid"));
      setSubmitting(false);
      return;
    }

    await refresh();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border border-stroke bg-white p-8 shadow-card-2 dark:border-dark-3 dark:bg-gray-dark"
      >
        <p className="text-sm font-medium uppercase tracking-wide text-primary">{t("login.subtitle")}</p>
        <h1 className="mt-2 text-2xl font-bold text-dark dark:text-white">{t("login.title")}</h1>

        <div className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-dark dark:text-white">
            {t("login.username")}
            <input
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="rounded-lg border border-stroke px-3 py-2.5 font-normal outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-dark dark:text-white">
            {t("login.password")}
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-lg border border-stroke px-3 py-2.5 font-normal outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              required
            />
          </label>
        </div>

        {error && <p className="mt-4 text-sm text-red">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-lg bg-primary px-4 py-3 font-medium text-white transition hover:bg-primary/90 disabled:opacity-60"
        >
          {submitting ? t("login.submitting") : t("login.submit")}
        </button>
      </form>
    </div>
  );
}
