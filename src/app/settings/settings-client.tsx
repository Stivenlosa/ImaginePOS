"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";
import { UserInfo } from "@/components/header/user-info";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "@/i18n";
import { USER_ROLES, type PublicUser, type UserRole } from "@/types/user";
import { TransferSettings } from "./transfer-settings";

type Draft = {
  id: number | null;
  name: string;
  username: string;
  password: string;
  role: UserRole;
  active: boolean;
};

const emptyDraft = (): Draft => ({
  id: null,
  name: "",
  username: "",
  password: "",
  role: "cajero",
  active: true,
});

export function SettingsClient() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, ready } = useAuth();
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);

  const loadUsers = useCallback(async () => {
    const response = await fetch("/api/users");
    if (response.status === 403) {
      router.replace("/");
      return;
    }
    if (!response.ok) {
      setError(t("common.error"));
      setLoading(false);
      return;
    }
    setUsers((await response.json()) as PublicUser[]);
    setLoading(false);
  }, [router, t]);

  useEffect(() => {
    if (!ready) return;
    if (user?.role !== "administrador") {
      router.replace("/");
      return;
    }
    void loadUsers();
  }, [ready, user, router, loadUsers]);

  function errorText(code: string) {
    const key = `settings.errors.${code}`;
    const message = t(key);
    return message === key ? t("common.error") : message;
  }

  async function saveUser(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    setError("");

    const payload = {
      name: draft.name,
      username: draft.username,
      role: draft.role,
      active: draft.active,
      ...(draft.password ? { password: draft.password } : {}),
    };

    const response = await fetch(draft.id ? `/api/users/${draft.id}` : "/api/users", {
      method: draft.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft.id ? payload : { ...payload, password: draft.password }),
    });

    setSaving(false);
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(errorText(data?.error ?? ""));
      return;
    }

    setDraft(null);
    await loadUsers();
  }

  async function setActive(target: PublicUser, active: boolean) {
    setError("");
    const response = await fetch(`/api/users/${target.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(errorText(data?.error ?? ""));
      return;
    }
    await loadUsers();
  }

  async function removeUser(target: PublicUser) {
    if (!window.confirm(t("settings.confirmDelete"))) return;
    setError("");
    const response = await fetch(`/api/users/${target.id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(errorText(data?.error ?? ""));
      return;
    }
    await loadUsers();
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">{t("settings.title")}</h1>
          <p className="mt-1 text-sm text-gray-6">{t("settings.subtitle")}</p>
        </div>
        <UserInfo />
      </div>

      <TransferSettings />

      <section className="rounded-xl border border-stroke bg-white p-5 shadow-card-2 dark:border-dark-3 dark:bg-gray-dark">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-dark dark:text-white">{t("settings.users")}</h2>
          <button
            type="button"
            onClick={() => {
              setError("");
              setDraft(emptyDraft());
            }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            {t("settings.newUser")}
          </button>
        </div>

        {error && <p className="mb-4 text-sm text-red">{error}</p>}

        {loading ? (
          <p className="text-sm text-gray-6">{t("common.loading")}</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-gray-6">{t("settings.empty")}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("settings.name")}</TableHead>
                <TableHead>{t("settings.username")}</TableHead>
                <TableHead>{t("settings.role")}</TableHead>
                <TableHead>{t("settings.status")}</TableHead>
                <TableHead>{t("settings.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-dark dark:text-white">{item.name}</TableCell>
                  <TableCell>{item.username}</TableCell>
                  <TableCell>{t(`settings.roles.${item.role}`)}</TableCell>
                  <TableCell>
                    <span
                      className={
                        item.active
                          ? "rounded-full bg-green-light-7 px-2.5 py-1 text-xs font-medium text-green-dark"
                          : "rounded-full bg-gray-2 px-2.5 py-1 text-xs font-medium text-gray-6 dark:bg-dark-3"
                      }
                    >
                      {item.active ? t("settings.active") : t("settings.inactive")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-md px-2 py-1 text-sm text-primary hover:bg-primary/10"
                        onClick={() => {
                          setError("");
                          setDraft({
                            id: item.id,
                            name: item.name,
                            username: item.username,
                            password: "",
                            role: item.role,
                            active: item.active,
                          });
                        }}
                      >
                        {t("common.edit")}
                      </button>
                      <button
                        type="button"
                        className="rounded-md px-2 py-1 text-sm text-dark hover:bg-gray-2 dark:text-dark-6 dark:hover:bg-dark-3"
                        onClick={() => void setActive(item, !item.active)}
                      >
                        {item.active ? t("settings.deactivate") : t("settings.activate")}
                      </button>
                      <button
                        type="button"
                        className="rounded-md px-2 py-1 text-sm text-red hover:bg-red-light-6"
                        onClick={() => void removeUser(item)}
                      >
                        {t("common.delete")}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form
            onSubmit={saveUser}
            className="w-full max-w-md rounded-xl bg-white p-6 dark:bg-gray-dark"
          >
            <h2 className="text-lg font-bold text-dark dark:text-white">
              {draft.id ? t("settings.editUser") : t("settings.newUser")}
            </h2>
            <div className="mt-4 flex flex-col gap-3">
              <input
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                placeholder={t("settings.name")}
                className="rounded border px-3 py-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                required
              />
              <input
                value={draft.username}
                onChange={(event) => setDraft({ ...draft, username: event.target.value })}
                placeholder={t("settings.username")}
                autoComplete="off"
                className="rounded border px-3 py-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                required
              />
              <input
                type="password"
                value={draft.password}
                onChange={(event) => setDraft({ ...draft, password: event.target.value })}
                placeholder={draft.id ? t("settings.passwordHint") : t("settings.password")}
                autoComplete="new-password"
                className="rounded border px-3 py-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                required={!draft.id}
              />
              <label className="flex flex-col gap-1 text-sm text-gray-6">
                {t("settings.role")}
                <select
                  value={draft.role}
                  onChange={(event) => setDraft({ ...draft, role: event.target.value as UserRole })}
                  className="rounded border px-3 py-2 text-dark dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                >
                  {USER_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {t(`settings.roles.${role}`)}
                    </option>
                  ))}
                </select>
              </label>
              {draft.id && (
                <label className="flex items-center gap-2 text-sm text-dark dark:text-white">
                  <input
                    type="checkbox"
                    checked={draft.active}
                    onChange={(event) => setDraft({ ...draft, active: event.target.checked })}
                  />
                  {t("settings.active")}
                </label>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="rounded-lg px-4 py-2 text-sm text-dark hover:bg-gray-2 dark:text-dark-6 dark:hover:bg-dark-3"
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
              >
                {saving ? t("common.saving") : t("common.save")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
