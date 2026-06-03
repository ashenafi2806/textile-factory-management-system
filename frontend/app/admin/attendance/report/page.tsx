"use client";

import { Navbar } from "@/components/layout/Navbar";
import AttendanceReportPage from "@/components/workforce/AttendanceReport";
import { useAuth } from "@/context/auth-context";

export default function AdminAttendanceReportPage() {
  const { user } = useAuth();

  if (
    !user ||
    (!user.roles.includes("ADMIN") &&
      !user.roles.includes("HR_ADMIN") &&
      !user.roles.includes("SUPERVISOR"))
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
        title="Attendance Report"
        subtitle="Organization-wide attendance analytics with department and shift filters."
        showDepartmentFilter
      />
    </>
  );
}
