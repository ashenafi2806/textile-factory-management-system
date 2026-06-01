"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";

export default function LeaveApproval() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await api.get("/workforce/leave/pending");
        setRequests(response.data);
      } catch (error) {
        console.error("Failed to fetch leave requests", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const handleAction = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      await api.put(`/workforce/leave/${id}/approve`, { status });
      setRequests(requests.filter((r) => r.id !== id));
      alert(`Request ${status.toLowerCase()} successfully`);
    } catch (error) {
      console.error("Failed to update leave request", error);
      alert("Error updating request");
    }
  };

  return (
    <>
      <Navbar />
      <div className="p-10 bg-gray-50 min-h-screen pt-12">
        <div className="max-w-6xl mx-auto">
          <header className="mb-12">
            <h1 className="text-4xl font-black text-gray-900 tracking-tightest mb-2">
              Leave Management
            </h1>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse"></span>
              <p className="text-gray-500 font-medium">
                Pending Approvals Queue
              </p>
            </div>
          </header>

          <div className="space-y-6">
            {loading ? (
              <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                Loading requests...
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-white rounded-4xl p-20 text-center border-2 border-dashed border-gray-200 shadow-sm">
                <p className="text-gray-400 text-xl font-medium italic">
                  Everything's approved! No pending requests.
                </p>
              </div>
            ) : (
              requests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-4xl p-8 shadow-sm border border-gray-100 flex flex-col lg:flex-row items-center justify-between hover:shadow-xl hover:border-indigo-100 transition-all group"
                >
                  <div className="flex items-center space-x-6 mb-6 lg:mb-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-2xl group-hover:scale-110 transition-transform">
                      {request.worker.user.username[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
                        {request.worker.user.username}
                      </h3>
                      <p className="text-gray-400 font-bold text-xs uppercase tracking-wider">
                        {request.worker.position} •{" "}
                        {request.worker.department?.name || "Production"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8 mb-6 lg:mb-0">
                    <div className="text-center sm:text-left bg-slate-50 p-4 rounded-xl">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                        Duration
                      </p>
                      <p className="text-gray-700 font-black">
                        {new Date(request.startDate).toLocaleDateString()} —{" "}
                        {new Date(request.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-center sm:text-left border-l-2 border-gray-100 pl-8">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                        Reason
                      </p>
                      <p className="text-gray-700 font-bold italic text-sm">
                        "{request.reason}"
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleAction(request.id, "APPROVED")}
                      className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all active:scale-95"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(request.id, "REJECTED")}
                      className="px-8 py-4 bg-white text-rose-600 border-2 border-rose-100 rounded-2xl font-black hover:bg-rose-50 transition-all active:scale-95"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
