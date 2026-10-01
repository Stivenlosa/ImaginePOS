"use client";

import { Sidebar } from "@/components/sidebar";
import { usePathname } from "next/navigation";

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <div className="min-h-screen w-full bg-gray-2 dark:bg-[#020d1a]">{children}</div>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="w-full bg-gray-2 dark:bg-[#020d1a]">
        <main className="isolate mx-auto w-full max-w-screen-3xl overflow-hidden p-4 md:p-6 2xl:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
