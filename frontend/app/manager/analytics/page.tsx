"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import { useCanPerform } from "@/hooks/useCanPerform";

export default function WorkforceAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const canView = useCanPerform(["MANAGER", "ADMIN", "HR_ADMIN"]);

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }
    const fetchAnalytics = async () => {
      try {
        const response = await api.get("/workforce/leave/analytics");
        setAnalytics(response.data);
      } catch (error) {
        console.error("Failed to fetch analytics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [canView]);

  if (!canView) {
    return (
      <>
        <Navbar />
        <div className="p-10 bg-slate-50 min-h-screen pt-20">
          <div className="max-w-2xl mx-auto rounded-2xl border border-rose-200 bg-rose-50 p-6">
            <h1 className="text-2xl font-bold text-rose-800">Access Denied</h1>
            <p className="mt-2 text-rose-700">
              Workforce Analytics is restricted to Managers, HR Admins, and
              Admins.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="p-10 bg-slate-900 min-h-screen text-white pt-12">
        <div className="max-w-7xl mx-auto">
          <header className="mb-16">
            <h1 className="text-5xl font-black tracking-tighter mb-4">
              Workforce Intelligence
            </h1>
            <p className="text-slate-400 text-xl max-w-2xl">
              Real-time insights into factory capacity, attendance trends, and
              labor availability.
            </p>
          </header>

          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center text-slate-500">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500 mb-4"></div>
              <span className="text-xl font-bold uppercase tracking-widest">
                Analyzing system data...
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-slate-800 p-10 rounded-4xl border border-slate-700 shadow-2xl relative overflow-hidden group hover:border-indigo-500 transition-colors">
                <div className="absolute top-0 right-0 p-8 text-indigo-500/20 group-hover:text-indigo-500/40 transition-colors">
                  <svg
                    className="w-24 h-24"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08s5.97 1.09 6 3.08c-1.29 1.94-3.5 3.22-6 3.22z" />
                  </svg>
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-2">
                  Total Workforce
                </p>
                <h2 className="text-7xl font-black mb-4">
                  {analytics.totalWorkers}
                </h2>
                <p className="text-indigo-400 font-medium tracking-tight">
                  ↑ Active Employee Profiles
                </p>
              </div>

              <div className="bg-slate-800 p-10 rounded-4xl border border-slate-700 shadow-2xl relative overflow-hidden group hover:border-amber-500 transition-colors">
                <div className="absolute top-0 right-0 p-8 text-amber-500/20 group-hover:text-amber-500/40 transition-colors">
                  <svg
                    className="w-24 h-24"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
                  </svg>
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-2">
                  Active Leaves
                </p>
                <h2 className="text-7xl font-black mb-4 text-amber-500">
                  {analytics.activeLeaves}
                </h2>
                <p className="text-slate-500 font-medium italic tracking-tight">
                  Currently off-duty
                </p>
              </div>

              <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-10 rounded-4xl shadow-2xl shadow-indigo-500/20 group hover:scale-[1.02] transition-transform">
                <p className="text-indigo-100 font-bold uppercase tracking-widest text-sm mb-2">
                  Available Capacity
                </p>
                <h2 className="text-7xl font-black mb-4">
                  {analytics.availableWorkers}
                </h2>
                <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-white h-full transition-all duration-1000"
                    style={{
                      width: `${(analytics.availableWorkers / analytics.totalWorkers) * 100}%`,
                    }}
                  ></div>
                </div>
                <p className="mt-4 text-indigo-100/80 font-bold tracking-tight">
                  System Ready for Allocation
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
