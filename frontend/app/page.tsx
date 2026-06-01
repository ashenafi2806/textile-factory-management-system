"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Navbar } from "@/components/layout/Navbar";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  if (!isLoading && user) {
    return null;
  }
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-200">
      <Navbar />

      <main className="relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/2 -z-10 -translate-x-1/2 blur-3xl xl:-top-24">
          <div
            className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30"
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
          ></div>
        </div>

        {/* Hero Section */}
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
          <div className="mx-auto max-w-2xl shrink-0 lg:mx-0 lg:max-w-xl lg:pt-8">
            <div className="mt-24 sm:mt-32 lg:mt-16">
              <span className="inline-flex items-center space-x-2 rounded-full border border-indigo-600/10 bg-indigo-600/5 px-3 py-1 font-semibold text-indigo-600">
                <span className="text-sm font-black uppercase tracking-wider">
                  v2.0 Released
                </span>
                <span
                  className="h-4 w-px bg-indigo-600/20"
                  aria-hidden="true"
                ></span>
                <span className="text-xs uppercase tracking-widest text-indigo-500">
                  Fully Automated
                </span>
              </span>
            </div>

            <h1 className="mt-10 text-5xl font-black tracking-tight text-slate-900 sm:text-7xl">
              Next-generation{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500">
                textile factory
              </span>{" "}
              intelligence.
            </h1>

            <p className="mt-6 text-lg leading-8 text-slate-600 mb-10 max-w-lg">
              Seamlessly unify your production line, inventory, workforce, and
              QA tracking into one beautifully powerful command center. Built
              for modern textile management.
            </p>

            <div className="mt-10 flex items-center gap-x-6">
              <Link
                href="/login"
                className="rounded-full bg-indigo-600 px-8 py-4 text-sm font-black text-white shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all duration-300"
              >
                Sign In to Platform
              </Link>
              <Link
                href="/dashboard"
                className="text-sm font-black leading-6 text-slate-900 flex items-center gap-2 hover:text-indigo-600 transition-colors"
              >
                View Dashboard <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-32">
            <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
              <div className="rounded-[2.5rem] border border-slate-200 bg-white/50 p-4 backdrop-blur-md shadow-2xl">
                <div className="rounded-[2rem] border border-slate-100 bg-white overflow-hidden flex items-center justify-center h-[500px] w-full max-w-[700px] relative">
                  {/* Decorative Elements */}
                  <div
                    className="absolute top-10 left-10 h-20 w-48 bg-white border border-slate-100 rounded-3xl shadow-xl p-4 animate-bounce"
                    style={{ animationDuration: "3s" }}
                  >
                    <div className="h-2 w-1/2 bg-slate-200 rounded-full mb-3"></div>
                    <div className="h-6 w-full bg-emerald-100 rounded-lg"></div>
                  </div>
                  <div
                    className="absolute bottom-20 right-10 h-32 w-56 bg-white border border-slate-100 rounded-3xl shadow-xl p-5 animate-pulse"
                    style={{ animationDuration: "4s" }}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div className="h-3 w-1/3 bg-slate-200 rounded-full"></div>
                      <div className="h-3 w-3 rounded-full bg-rose-500"></div>
                    </div>
                    <div className="h-10 w-full bg-indigo-50 rounded-xl"></div>
                  </div>

                  <div className="text-center">
                    <h3 className="text-4xl font-black text-slate-200 uppercase tracking-[0.2em] mb-2 transform -rotate-12">
                      TFMS
                    </h3>
                    <p className="font-bold text-slate-300 uppercase tracking-widest text-sm transform -rotate-12">
                      System Live
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Preview Strip */}
        <div className="border-y border-slate-200 bg-white shadow-sm overflow-hidden py-10">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              <div className="text-center border-r border-slate-100 last:border-0 pl-0">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-indigo-600 mb-2">
                  Production
                </p>
                <h4 className="text-lg font-bold text-slate-900">
                  Stage Sequencing
                </h4>
              </div>
              <div className="text-center border-r border-slate-100 last:border-0">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600 mb-2">
                  Inventory
                </p>
                <h4 className="text-lg font-bold text-slate-900">
                  BOM Validation
                </h4>
              </div>
              <div className="text-center border-r border-slate-100 last:border-0">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-rose-600 mb-2">
                  Quality
                </p>
                <h4 className="text-lg font-bold text-slate-900">
                  Live QA Checkpoints
                </h4>
              </div>
              <div className="text-center">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-600 mb-2">
                  Workforce
                </p>
                <h4 className="text-lg font-bold text-slate-900">
                  Task Assignments
                </h4>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
