"use client";
import React from "react";
import LeavesTabs from "@/components/workforce/LeavesTabs";

export default function LeavesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Leaves</h1>
      <div className="card p-4">
        <LeavesTabs />
      </div>
    </div>
  );
}
