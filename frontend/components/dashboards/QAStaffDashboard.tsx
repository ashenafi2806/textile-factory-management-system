"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";

const reviews = [
  {
    id: "PO-9981",
    product: "Denim Jackets",
    stage: "SEWING",
    supervisor: "Amina",
    submittedAt: "May 15, 09:10 AM",
    status: "PENDING",
  },
  {
    id: "PO-9938",
    product: "Uniform Shirts",
    stage: "FINISHING",
    supervisor: "Daniel",
    submittedAt: "May 15, 08:45 AM",
    status: "PENDING",
  },
  {
    id: "PO-9960",
    product: "Workwear Pants",
    stage: "PACKING",
    supervisor: "Mary",
    submittedAt: "May 14, 04:25 PM",
    status: "PENDING",
  },
];

export function QAStaffDashboard() {
  const [selectedReview, setSelectedReview] = useState<
    (typeof reviews)[number] | null
  >(null);
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    measurements: "",
    defects: "",
    notes: "",
    rejectionReason: "",
  });
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | null>(
    null,
  );

  const kpis = useMemo(
    () => [
      { title: "Pending Reviews", value: "12" },
      { title: "Approved Today", value: "8" },
      { title: "Rejected Today", value: "2" },
      { title: "Orders Awaiting QA", value: "5" },
    ],
    [],
  );

  const history = useMemo(
    () => [
      {
        id: "PO-9955",
        product: "Safety Vests",
        stage: "PACKING",
        outcome: "APPROVED",
        date: "May 14",
      },
      {
        id: "PO-9920",
        product: "T-Shirt Sets",
        stage: "SEWING",
        outcome: "REJECTED",
        date: "May 14",
      },
      {
        id: "PO-9892",
        product: "Aprons",
        stage: "FINISHING",
        outcome: "APPROVED",
        date: "May 13",
      },
    ],
    [],
  );

  function openReview(review: (typeof reviews)[number]) {
    setSelectedReview(review);
    setShowReviewPanel(true);
    setActionType(null);
    setReviewForm({
      measurements: "",
      defects: "",
      notes: "",
      rejectionReason: "",
    });
  }

  function closeReview() {
    setShowReviewPanel(false);
    setSelectedReview(null);
    setActionType(null);
  }

  function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    closeReview();
  }

  return (
    <div className="space-y-10">
      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <div
            key={item.title}
            className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-black uppercase tracking-[.28em] text-slate-400 mb-3">
              {item.title}
            </p>
            <p className="text-4xl font-black text-slate-900">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm font-black uppercase tracking-[.28em] text-slate-400">
                Pending QA Reviews
              </p>
              <h2 className="text-2xl font-black text-slate-900">
                Review queue
              </h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black uppercase tracking-[.24em] text-slate-600">
              24 total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3 text-left text-sm text-slate-700">
              <thead>
                <tr className="text-slate-400 uppercase tracking-[.2em] text-[10px]">
                  <th className="pb-3 pr-6">Order #</th>
                  <th className="pb-3 pr-6">Product</th>
                  <th className="pb-3 pr-6">Stage</th>
                  <th className="pb-3 pr-6">Supervisor</th>
                  <th className="pb-3 pr-6">Submitted At</th>
                  <th className="pb-3 pl-6">Action</th>
                </tr>
              </thead>
              <tbody className="space-y-4">
                {reviews.map((review) => (
                  <tr
                    key={review.id}
                    className="rounded-4xl bg-slate-50 border border-slate-200"
                  >
                    <td className="py-4 pr-6 font-bold">{review.id}</td>
                    <td className="py-4 pr-6">{review.product}</td>
                    <td className="py-4 pr-6">{review.stage}</td>
                    <td className="py-4 pr-6">{review.supervisor}</td>
                    <td className="py-4 pr-6">{review.submittedAt}</td>
                    <td className="py-4 pl-6">
                      <button
                        onClick={() => openReview(review)}
                        className="rounded-3xl bg-indigo-600 px-4 py-2 text-xs font-black uppercase tracking-[.24em] text-white hover:bg-indigo-700"
                      >
                        Open Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-3">
              Inspection History
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Recent approvals and rejections with quick filters.
            </p>
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-black text-slate-900">
                      {item.id}
                    </span>
                    <span
                      className={
                        item.outcome === "APPROVED"
                          ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-[.24em] text-emerald-700"
                          : "rounded-full bg-rose-100 px-3 py-1 text-xs font-black uppercase tracking-[.24em] text-rose-700"
                      }
                    >
                      {item.outcome}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    {item.product} · {item.stage}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">{item.date}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      {showReviewPanel && selectedReview && (
        <Modal title={`Review ${selectedReview.id}`} onClose={closeReview}>
          <div className="space-y-6">
            <div className="rounded-4xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-black uppercase tracking-[.24em] text-slate-400">
                Order
              </p>
              <h3 className="text-2xl font-black text-slate-900">
                {selectedReview.id}
              </h3>
              <p className="text-sm text-slate-600">{selectedReview.product}</p>
              <p className="mt-3 text-sm text-slate-500">
                Stage: {selectedReview.stage}
              </p>
              <p className="text-sm text-slate-500">
                Supervisor: {selectedReview.supervisor}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <MetricBlock label="Good Qty" value="240" />
              <MetricBlock label="Defective Qty" value="18" />
            </div>
            <form onSubmit={submitReview} className="space-y-4">
              <Field
                label="Measurements"
                value={reviewForm.measurements}
                onChange={(value) =>
                  setReviewForm((prev) => ({ ...prev, measurements: value }))
                }
              />
              <Field
                label="Defects Observed"
                value={reviewForm.defects}
                onChange={(value) =>
                  setReviewForm((prev) => ({ ...prev, defects: value }))
                }
              />
              <TextArea
                label="Notes / Comments"
                value={reviewForm.notes}
                onChange={(value) =>
                  setReviewForm((prev) => ({ ...prev, notes: value }))
                }
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setActionType("REJECT");
                  }}
                  className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-black text-rose-700 hover:bg-rose-100"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => setActionType("APPROVE")}
                  className="rounded-3xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700"
                >
                  Approve
                </button>
              </div>
              {actionType === "REJECT" && (
                <Field
                  label="Rejection Reason"
                  value={reviewForm.rejectionReason}
                  onChange={(value) =>
                    setReviewForm((prev) => ({
                      ...prev,
                      rejectionReason: value,
                    }))
                  }
                />
              )}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeReview}
                  className="rounded-3xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-3xl bg-indigo-600 px-5 py-3 text-sm font-black text-white hover:bg-indigo-700"
                >
                  Save Review
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}

function MetricBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-4xl border border-slate-200 bg-white p-5 text-center shadow-sm">
      <p className="text-xs font-black uppercase tracking-[.28em] text-slate-400 mb-2">
        {label}
      </p>
      <p className="text-3xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-black text-slate-900">
      <span className="mb-2 block uppercase tracking-[.24em] text-slate-500">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-black text-slate-900">
      <span className="mb-2 block uppercase tracking-[.24em] text-slate-500">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-28 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
      />
    </label>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-2xl rounded-4xl bg-white p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-black text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
