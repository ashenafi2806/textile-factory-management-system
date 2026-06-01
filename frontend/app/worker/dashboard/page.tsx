/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useAuth } from "@/context/auth-context";
import { Navbar } from "@/components/layout/Navbar";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function WorkerDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [shift, setShift] = useState<string>("Loading...");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // We'd add an endpoint for the current worker's profile
        // For now we query a general search
        const res = await api.get("/workforce/workers");
        const myProfile = res.data.find((w: any) => w.user.id === user?.id);
        setProfile(myProfile);

        if (myProfile) {
          const shiftRes = await api.get(
            `/workforce/shifts/worker/${myProfile.id}?date=${new Date().toISOString()}`,
          );
          setShift(shiftRes.data.shift);
        }
      } catch (error) {
        console.error("Failed to fetch profile", error);
      }
    };
    if (user) fetchProfile();
  }, [user]);

  if (!user) return null;

  return (
    <>
      <Navbar />
      <div className="p-8 bg-slate-50 min-h-screen pt-12">
        <div className="max-w-6xl mx-auto">
          <header className="mb-10">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Worker Portal
            </h1>
            <p className="text-slate-500 font-medium">
              Personalized dashboard for factory operations.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-8 rounded-4xl shadow-sm border border-slate-100 flex items-center space-x-6">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Today&apos;s Shift
                </p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter uppercase">
                  {shift}
                </p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-4xl shadow-sm border border-slate-100 flex items-center space-x-6">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Attendance Status
                </p>
                <p className="text-2xl font-black text-emerald-600 tracking-tighter uppercase font-mono">
                  Present
                </p>
              </div>
            </div>

            <div className="bg-indigo-600 p-8 rounded-4xl shadow-xl shadow-indigo-100 flex items-center space-x-6 text-white">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-1">
                  Skill Progress
                </p>
                <p className="text-2xl font-black tracking-tighter uppercase">
                  {profile?.skillLevel || "Junior"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-4xl shadow-sm border border-slate-100">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center space-x-2 uppercase tracking-tighter">
                <svg
                  className="w-5 h-5 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>My Calendar</span>
              </h3>
              <div className="space-y-4">
                <ScheduleItem
                  date="Today"
                  action="Check-in 08:00 AM"
                  status="Early"
                />
                <ScheduleItem
                  date="Yesterday"
                  action="Full Shift Completed"
                  status="8h 12m"
                />
                <ScheduleItem
                  date="24 Apr"
                  action="Weekly Off Day"
                  status="Rest"
                />
              </div>
            </div>

            <div className="bg-white p-8 rounded-4xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
              <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-6">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter">
                Need Time Off?
              </h3>
              <p className="text-slate-500 font-medium mb-8 max-w-sm">
                Submit your leave request here. Management will be notified for
                approval.
              </p>
              <button className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black hover:bg-slate-800 transition-all active:scale-95">
                Request Leave
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ScheduleItem({ date, action, status }: any) {
  return (
    <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-200 transition-all cursor-default">
      <div className="flex items-center space-x-4">
        <div className="text-xs font-black text-indigo-600 uppercase w-16">
          {date}
        </div>
        <div className="font-bold text-slate-900 text-sm">{action}</div>
      </div>
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg border border-slate-100">
        {status}
      </span>
    </div>
  );
}
