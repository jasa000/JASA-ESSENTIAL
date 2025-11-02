
"use client";

import { AuthProvider } from "@/context/auth-provider";
import { CartProvider } from "@/context/cart-provider";
import { LoadingProvider } from "@/context/loading-provider";
import { ThemeProvider } from "@/context/theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <CartProvider>
          <LoadingProvider>
            {children}
          </LoadingProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
