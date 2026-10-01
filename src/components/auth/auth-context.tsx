"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { SessionUser } from "@/types/user";

type AuthContextValue = {
  user: SessionUser | null;
  ready: boolean;
  refresh: () => Promise<SessionUser | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/auth/me");
    if (!response.ok) {
      setUser(null);
      setReady(true);
      return null;
    }
    const data = (await response.json()) as { user: SessionUser };
    setUser(data.user);
    setReady(true);
    return data.user;
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (ready && !user && pathname !== "/login") {
      router.push("/login");
    }
  }, [ready, user, pathname, router]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
    router.refresh();
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, ready, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
