"use client";

import EmployeeManagementPage from "@/components/workforce/EmployeeManagementPage";

const roleOptions = [
  "ADMIN",
  "HR_ADMIN",
  "MANAGER",
  "SUPERVISOR",
  "WORKER",
  "STOREKEEPER",
  "PRODUCTION_MANAGER",
  "PRODUCTION_SUPERVISOR",
  "MAINTENANCE_MANAGER",
  "MAINTENANCE_TECHNICIAN",
  "QA_MANAGER",
  "QA_STAFF",
];

interface UserRecord {
  id: string;
  username: string;
  email: string;
  isVerified: boolean;
  roles: Array<{ name: string }>;
}

interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  roles: string[];
}

export default function AdminUsersPage() {
  return <EmployeeManagementPage />;
}
