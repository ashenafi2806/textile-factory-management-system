"use client";
import React from "react";
import StaffingDashboard from "@/components/workforce/StaffingDashboard";

export default function StaffingPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Staffing</h1>
      <div className="card p-4">
        <StaffingDashboard />
      </div>
    </div>
  );
}
