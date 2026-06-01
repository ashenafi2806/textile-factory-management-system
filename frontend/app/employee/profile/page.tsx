"use client";
import React from "react";
import WorkerProfile from "@/components/workforce/WorkerProfile";

export default function Page() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">My Profile</h2>
      <WorkerProfile />
    </div>
  );
}
