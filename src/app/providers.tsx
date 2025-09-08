"use client";

import { SidebarProvider } from "@/components/sidebar/sidebar-context";
import { CartProvider } from "@/components/cartSummary/cart-context";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="light" attribute="class">
        <SidebarProvider>
            <CartProvider>
                {children}
            </CartProvider>
        </SidebarProvider>
    </ThemeProvider>
  );
}
