"use client";

import WorkerProfile from "@/components/workforce/WorkerProfile";

export default function WorkerProfilePage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          My Profile
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Keep your account details and profile picture up to date.
        </p>
      </div>
      <WorkerProfile />
    </div>
  );
}
