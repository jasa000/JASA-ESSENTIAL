
import type { Metadata } from "next";
import { Poppins, PT_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from "@/context/cart-provider";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "@/components/app-sidebar";
import { AuthProvider } from "@/context/auth-provider";
import { ThemeProvider } from "@/context/theme-provider";
import { LoadingProvider } from "@/context/loading-provider";
import GlobalLoader from "@/components/global-loader";

export const metadata: Metadata = {
  title: "Jasa Essentials",
  description: "Your one-stop shop for quality stationery.",
};

const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
  weight: ['400', '600', '700'],
});

const ptSans = PT_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pt-sans',
  weight: ['400', '700'],
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${poppins.variable} ${ptSans.variable}`}>
      <body className="font-body antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <CartProvider>
              <LoadingProvider>
                <SidebarProvider>
                  <Sidebar>
                    <AppSidebar />
                  </Sidebar>
                  <SidebarInset>
                    <GlobalLoader />
                    <div className="flex min-h-screen flex-col">
                      <Header />
                      <main className="flex-grow">{children}</main>
                    </div>
                    <Toaster />
                  </SidebarInset>
                </SidebarProvider>
              </LoadingProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
