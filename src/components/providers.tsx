
"use client";

import { AuthProvider } from "@/context/auth-provider";
import { CartProvider } from "@/context/cart-provider";
import { LoadingProvider } from "@/context/loading-provider";
import { LocationProvider } from "@/context/location-provider";
import { ThemeProvider } from "@/context/theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <CartProvider>
          <LoadingProvider>
            <LocationProvider>
              {children}
            </LocationProvider>
          </LoadingProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
