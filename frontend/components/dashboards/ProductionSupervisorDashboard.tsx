"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";

const stageSteps = ["CUTTING", "SEWING", "FINISHING", "PACKING"];

export function ProductionSupervisorDashboard() {
  const [showOutputForm, setShowOutputForm] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [outputForm, setOutputForm] = useState({
    shiftDate: "",
    goodQuantity: "",
    defectiveQuantity: "",
    notes: "",
  });
  const [issueForm, setIssueForm] = useState({
    issueType: "MATERIAL_SHORTAGE",
    description: "",
    priority: "NORMAL",
  });

  const orders = useMemo(
    () => [
      {
        id: "PO-9981",
        product: "Denim Jackets",
        stage: "SEWING",
        progress: 72,
        status: "IN_PROGRESS",
      },
      {
        id: "PO-9932",
        product: "Uniform Shirts",
        stage: "CUTTING",
        progress: 45,
        status: "IN_PROGRESS",
      },
      {
        id: "PO-9918",
        product: "Safety Vests",
        stage: "CUTTING",
        progress: 12,
        status: "STOPPED",
      },
    ],
    [],
  );

  const currentStage = {
    orderId: "PO-9981",
    product: "Denim Jackets",
    stage: "SEWING",
    startedAt: "May 15, 08:30 AM",
    status: "IN_PROGRESS",
  };

  const kpis = [
    { title: "My Active Orders", value: "3" },
    { title: "Current Stage", value: currentStage.stage },
    { title: "Today's Output", value: "980" },
    { title: "Open Issues", value: "5" },
  ];

  function submitOutput(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowOutputForm(false);
  }

  function submitIssue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowIssueForm(false);
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

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[.28em] text-slate-400">
                  Current Stage
                </p>
                <h2 className="text-3xl font-black text-slate-900">
                  {currentStage.orderId}
                </h2>
                <p className="text-sm text-slate-500">
                  {currentStage.product} • {currentStage.stage}
                </p>
              </div>
              <div className="rounded-3xl bg-indigo-600 px-4 py-3 text-sm font-black text-white">
                Started at {currentStage.startedAt}
              </div>
            </div>
            <div className="mt-8 flex flex-col gap-4">
              <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className="text-sm font-bold text-slate-900">
                    Stage completion
                  </span>
                  <span className="text-xs font-black uppercase tracking-[.24em] text-slate-500">
                    QA review pending
                  </span>
                </div>
                <div className="h-4 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full w-[72%] rounded-full bg-indigo-600" />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="rounded-3xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700">
                  Mark Stage Complete
                </button>
                <button className="rounded-3xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-200">
                  Request QA Review
                </button>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <p className="text-sm font-black uppercase tracking-[.28em] text-slate-400">
                Stage Sequence
              </p>
              <div className="space-y-3">
                {stageSteps.map((step, index) => {
                  const active = step === currentStage.stage;
                  return (
                    <div key={step} className="flex items-center gap-4">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-full border ${active ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-500"}`}
                      >
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-black text-slate-900">
                          {step}
                        </p>
                        <p className="text-xs text-slate-500">
                          {active
                            ? "Active stage"
                            : index < stageSteps.indexOf(currentStage.stage)
                              ? "Completed"
                              : "Pending"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm font-black uppercase tracking-[.28em] text-slate-400">
                  My Orders
                </p>
                <h2 className="text-2xl font-black text-slate-900">
                  Assigned Production Orders
                </h2>
              </div>
              <button
                onClick={() => setShowOutputForm(true)}
                className="rounded-3xl bg-indigo-600 px-4 py-2 text-sm font-black text-white hover:bg-indigo-700"
              >
                Record Output
              </button>
            </div>
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-3xl border border-slate-100 bg-slate-50 p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {order.id} · {order.product}
                      </p>
                      <p className="text-xs uppercase tracking-[.28em] text-slate-500">
                        Current Stage: {order.stage}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black uppercase ${statusBadge(order.status)}`}
                    >
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[.24em] text-slate-400">
                      Progress
                    </div>
                    <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-600"
                        style={{ width: `${order.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button className="rounded-3xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-200">
                      Start
                    </button>
                    <button className="rounded-3xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-200">
                      Stop
                    </button>
                    <button className="rounded-3xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-200">
                      Resume
                    </button>
                    <button className="rounded-3xl bg-amber-100 px-4 py-2 text-xs font-black text-amber-700 hover:bg-amber-200">
                      Report Issue
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[.28em] text-slate-400">
                  Record Output
                </p>
                <h2 className="text-2xl font-black text-slate-900">
                  Quick Entry
                </h2>
              </div>
              <button
                onClick={() => setShowOutputForm(true)}
                className="rounded-3xl bg-indigo-600 px-4 py-2 text-sm font-black text-white hover:bg-indigo-700"
              >
                Open Form
              </button>
            </div>
            <p className="text-sm text-slate-500">
              Submit today&apos;s batch output with quality counts and notes.
            </p>
          </div>

          <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[.28em] text-slate-400">
                  Report Issue
                </p>
                <h2 className="text-2xl font-black text-slate-900">
                  Create Alert
                </h2>
              </div>
              <button
                onClick={() => setShowIssueForm(true)}
                className="rounded-3xl bg-rose-600 px-4 py-2 text-sm font-black text-white hover:bg-rose-700"
              >
                New Issue
              </button>
            </div>
            <p className="text-sm text-slate-500">
              Log critical issues and notify the maintenance team immediately.
            </p>
          </div>
        </aside>
      </section>

      {showOutputForm && (
        <Modal title="Record Output" onClose={() => setShowOutputForm(false)}>
          <form onSubmit={submitOutput} className="space-y-4">
            <Field
              label="Shift Date"
              type="date"
              value={outputForm.shiftDate}
              onChange={(value) =>
                setOutputForm((prev) => ({ ...prev, shiftDate: value }))
              }
            />
            <Field
              label="Good Quantity"
              type="number"
              value={outputForm.goodQuantity}
              onChange={(value) =>
                setOutputForm((prev) => ({ ...prev, goodQuantity: value }))
              }
            />
            <Field
              label="Defective Quantity"
              type="number"
              value={outputForm.defectiveQuantity}
              onChange={(value) =>
                setOutputForm((prev) => ({ ...prev, defectiveQuantity: value }))
              }
            />
            <TextArea
              label="Notes"
              value={outputForm.notes}
              onChange={(value) =>
                setOutputForm((prev) => ({ ...prev, notes: value }))
              }
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowOutputForm(false)}
                className="rounded-3xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-3xl bg-indigo-600 px-5 py-3 text-sm font-black text-white hover:bg-indigo-700"
              >
                Submit Output
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showIssueForm && (
        <Modal title="Report Issue" onClose={() => setShowIssueForm(false)}>
          <form onSubmit={submitIssue} className="space-y-4">
            <label className="block text-sm font-black text-slate-900 uppercase tracking-[.24em]">
              Issue Type
            </label>
            <select
              value={issueForm.issueType}
              onChange={(e) =>
                setIssueForm((prev) => ({ ...prev, issueType: e.target.value }))
              }
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            >
              <option value="MATERIAL_SHORTAGE">Material Shortage</option>
              <option value="MACHINE_FAILURE">Machine Failure</option>
              <option value="OTHER">Other</option>
            </select>
            <TextArea
              label="Description"
              value={issueForm.description}
              onChange={(value) =>
                setIssueForm((prev) => ({ ...prev, description: value }))
              }
            />
            <label className="block text-sm font-black text-slate-900 uppercase tracking-[.24em]">
              Priority
            </label>
            <select
              value={issueForm.priority}
              onChange={(e) =>
                setIssueForm((prev) => ({ ...prev, priority: e.target.value }))
              }
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            >
              <option value="NORMAL">Normal</option>
              <option value="CRITICAL">Critical</option>
            </select>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowIssueForm(false)}
                className="rounded-3xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-3xl bg-rose-600 px-5 py-3 text-sm font-black text-white hover:bg-rose-700"
              >
                Submit Issue
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-black text-slate-900">
      <span className="mb-2 block uppercase tracking-[.24em] text-slate-500">
        {label}
      </span>
      <input
        type={type}
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

function statusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-700";
    case "IN_PROGRESS":
      return "bg-indigo-100 text-indigo-700";
    case "STOPPED":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}
