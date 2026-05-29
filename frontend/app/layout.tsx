"use client";

import "./globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/auth-context";
import { SidebarProvider } from "@/context/sidebar-context";
import { useState } from "react";
import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <html lang="en">
      <body className="antialiased">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SidebarProvider>
              {children}
              <Toaster position="top-right" />
            </SidebarProvider>
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
