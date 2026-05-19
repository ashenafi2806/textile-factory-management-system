"use client";

import { ReactNode } from "react";

export default function ProductionOrdersLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
