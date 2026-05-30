"use client";
import React, { useEffect, useState } from "react";
import workforceService from "@/services/workforceService";

export default function Page() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    workforceService
      .getTrainingMaterials()
      .then((r: any) => setMaterials(r.data || []))
      .catch((e) => console.error("Failed to load training materials", e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4">Loading training materials...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Training Materials</h2>
      {materials.length === 0 ? (
        <div>No training materials available.</div>
      ) : (
        <ul className="space-y-3">
          {materials.map((m) => (
            <li
              key={m.id}
              className="p-3 border rounded flex items-center justify-between"
            >
              <div>
                <div className="font-medium">{m.title}</div>
                <div className="text-sm text-slate-600">{m.description}</div>
              </div>
              <div>
                {m.fileUrl ? (
                  <a
                    className="btn btn-ghost"
                    href={m.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Download
                  </a>
                ) : (
                  <a
                    className="btn btn-ghost"
                    href={`/training/materials/${m.id}`}
                  >
                    View
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
