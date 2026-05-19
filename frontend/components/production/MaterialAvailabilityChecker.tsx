"use client";

export function MaterialAvailabilityChecker({
  items,
}: {
  items: Array<{
    material: string;
    required: string;
    stock: string;
    status: string;
  }>;
}) {
  return (
    <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-lg font-black text-slate-900">
          Material Availability
        </h3>
        <span className="text-xs font-semibold uppercase tracking-[.24em] text-slate-500">
          BOM status
        </span>
      </div>
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.material}
            className="rounded-3xl border border-slate-100 bg-slate-50 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-black text-slate-900">{item.material}</p>
                <p className="text-sm text-slate-500">
                  Required: {item.required} · Stock: {item.stock}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[.24em] ${item.status === "Available" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
              >
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
