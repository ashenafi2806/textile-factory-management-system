"use client";

import { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { useSidebar } from "@/context/sidebar-context";

export default function ProductionOrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { contentOffset, isDesktop } = useSidebar();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Navbar />
      <main
        style={isDesktop ? { paddingLeft: contentOffset } : undefined}
        className="pt-20 md:pt-16 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 transition-all duration-300"
      >
        {children}
      </main>
    </div>
  );
}
