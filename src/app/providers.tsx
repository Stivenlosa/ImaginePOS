"use client";

import { AuthProvider } from "@/components/auth/auth-context";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import { SidebarProvider } from "@/components/sidebar/sidebar-context";
import { CartProvider } from "@/components/cartSummary/cart-context";
import { LanguageProvider } from "@/i18n";
import { ThemeProvider } from "next-themes";
import PaymentAnnouncer from "@/components/PaymentAnnouncer/PaymentAnnouncer";
import { ArrowFocusNavigator } from "@/components/keyboard/arrow-focus-navigator";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="light" attribute="class">
      <LanguageProvider defaultLanguage="en">
        <AuthProvider>
        <SidebarProvider>
          <CartProvider>
            <RegisterServiceWorker />
            <ArrowFocusNavigator />
            <PaymentAnnouncer />
            {children}
          </CartProvider>
        </SidebarProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
