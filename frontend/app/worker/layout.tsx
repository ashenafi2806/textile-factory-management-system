"use client";

import { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { useSidebar } from "@/context/sidebar-context";

export default function WorkerLayout({ children }: { children: ReactNode }) {
  const { contentOffset, isDesktop } = useSidebar();

  return (
    <div className="min-h-screen bg-slate-50 transition-colors dark:bg-slate-900">
      <Navbar />
      <main
        style={isDesktop ? { paddingLeft: contentOffset } : undefined}
        className="mx-auto max-w-7xl px-4 py-8 pt-20 transition-all duration-300 md:px-6 md:pt-16 lg:px-8"
      >
        {children}
      </main>
    </div>
  );
}
