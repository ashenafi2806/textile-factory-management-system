"use client";
import React from "react";
import WorkersTable from "@/components/workforce/WorkersTable";

export default function WorkersPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Workers</h1>
      <div className="card">
        <div className="p-4">
          <WorkersTable />
        </div>
      </div>
    </div>
  );
}
