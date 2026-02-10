"use client";

import { SidebarProvider } from "@/components/sidebar/sidebar-context";
import { CartProvider } from "@/components/cartSummary/cart-context";
import { LanguageProvider } from "@/i18n";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="light" attribute="class">
      <LanguageProvider defaultLanguage="en">
        <SidebarProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </SidebarProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
