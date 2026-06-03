"use client";

import { type ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { useSidebar } from "@/context/sidebar-context";

export default function MaintenanceLayout({ children }: { children: ReactNode }) {
  const { contentOffset, isDesktop } = useSidebar();

  return (
    <>
      <Navbar />
      <div
        className="min-h-screen bg-slate-50 pt-20 transition-all duration-300 md:pt-16"
        style={isDesktop ? { paddingLeft: contentOffset } : undefined}
      >
        {children}
      </div>
    </>
  );
}
