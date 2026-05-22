"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";

export default function OrderIssuesPage({
  params,
}: {
  params: { id: string };
}) {
  const routeParams = useParams();
  const id = params?.id ?? (routeParams.id as string);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchIssues = async () => {
      try {
        const res = await api.get(`/production/${id}/issues`);
        if (active) {
          setIssues(res.data);
          setError(null);
        }
      } catch {
        if (active) setError("Failed to load issues.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchIssues();
    const timer = window.setInterval(() => void fetchIssues(), 5000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [id]);

  return (
    <div className="space-y-8">
      <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900">
          Order {id} Issues
        </h1>
        <p className="mt-2 text-slate-500">
          Review reported issues and their current status for this order.
        </p>
      </div>

      <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm overflow-x-auto">
        {loading ? (
          <p className="text-sm text-slate-500">Loading live issue data...</p>
        ) : error ? (
          <p className="text-sm text-rose-600">{error}</p>
        ) : null}
        <table className="min-w-full text-left text-sm text-slate-700">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-[.2em] text-[10px]">
              <th className="py-4 pr-6">Type</th>
              <th className="py-4 pr-6">Priority</th>
              <th className="py-4 pr-6">Reported By</th>
              <th className="py-4 pr-6">Date</th>
              <th className="py-4 pl-6">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {issues.map((issue) => (
              <tr key={issue.id}>
                <td className="py-5 pr-6 font-bold">{issue.issueType}</td>
                <td className="py-5 pr-6">{issue.priority}</td>
                <td className="py-5 pr-6">{issue.reportedBy?.username || "—"}</td>
                <td className="py-5 pr-6">
                  {new Date(issue.createdAt).toLocaleString()}
                </td>
                <td className="py-5 pl-6">{issue.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
