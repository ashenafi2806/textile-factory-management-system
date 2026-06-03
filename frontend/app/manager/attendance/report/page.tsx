"use client";

import { Navbar } from "@/components/layout/Navbar";
import AttendanceReportPage from "@/components/workforce/AttendanceReport";
import { useAuth } from "@/context/auth-context";

export default function ManagerAttendanceReportPage() {
  const { user } = useAuth();

  if (
    !user ||
    (!user.roles.includes("MANAGER") &&
      !user.roles.includes("ADMIN") &&
      !user.roles.includes("HR_ADMIN"))
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-600">Access denied.</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <AttendanceReportPage
        title="Department Attendance Report"
        subtitle="Track present, late, absent, and leave counts for your department over any date range."
        showDepartmentFilter={false}
      />
    </>
  );
}
