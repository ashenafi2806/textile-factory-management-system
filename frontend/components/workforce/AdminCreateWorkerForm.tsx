"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  KeyRound,
  Shield,
  User,
  UserPlus,
} from "lucide-react";
import workforceService from "@/services/workforceService";
import toast from "react-hot-toast";
import {
  FormSection,
  WorkforceButton,
  WorkforceInput,
  WorkforceLabel,
  WorkforceSelect,
} from "@/components/workforce/workforce-ui";

const roleOptions = [
  "WORKER",
  "SUPERVISOR",
  "MANAGER",
  "HR_ADMIN",
  "ADMIN",
  "STOREKEEPER",
  "PRODUCTION_MANAGER",
  "PRODUCTION_SUPERVISOR",
  "MAINTENANCE_MANAGER",
  "MAINTENANCE_TECHNICIAN",
  "QA_MANAGER",
  "QA_STAFF",
];

export default function AdminCreateWorkerForm() {
  const qc = useQueryClient();

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const response = await workforceService.getDepartments();
      return response.data ?? [];
    },
    retry: false,
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ["shifts"],
    queryFn: async () => {
      const response = await workforceService.getShifts();
      return response.data;
    },
    retry: false,
  });

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [salary, setSalary] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [skillLevel, setSkillLevel] = useState("Intermediate");
  const [department, setDepartment] = useState("");
  const [shiftId, setShiftId] = useState("");
  const [roles, setRoles] = useState<string[]>(["WORKER"]);

  const mutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await workforceService.createWorker(payload);
      const worker = response.data ?? response;
      if (shiftId) {
        await workforceService.assignShift({
          workerId: worker.id,
          shiftId,
        });
      }
      return worker;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workers"] });
      setUsername("");
      setEmail("");
      setPassword("");
      setEmployeeId("");
      setFullName("");
      setJobTitle("");
      setSalary("");
      setPhoneNumber("");
      setEmergencyContact("");
      setSkillLevel("Intermediate");
      setDepartment("");
      setShiftId("");
      setRoles(["WORKER"]);
      toast.success("Employee registered successfully");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to create employee",
      );
    },
  });

  const toggleRole = (role: string) => {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return toast.error("Username is required");
    if (!email.trim()) return toast.error("Email is required");
    if (!password.trim()) return toast.error("Password is required");
    if (!fullName.trim()) return toast.error("Full name is required");
    if (!jobTitle.trim()) return toast.error("Position is required");
    if (roles.length === 0) return toast.error("Select at least one role");

    mutation.mutate({
      username: username.trim(),
      fullName: fullName.trim(),
      email: email.trim(),
      password: password.trim(),
      employeeId: employeeId.trim() || undefined,
      position: jobTitle.trim(),
      salary: salary ? parseFloat(salary) : undefined,
      phoneNumber: phoneNumber.trim() || undefined,
      emergencyContact: emergencyContact.trim() || undefined,
      skillLevel: skillLevel || undefined,
      department: department.trim() || undefined,
      roles,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-10">
      <div className="flex items-start gap-4 border-b border-slate-100 pb-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
          <UserPlus className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">
            Register new employee
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Creates a login account and worker profile. Assign a department and
            optional shift after departments are set up.
          </p>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <FormSection
          icon={<KeyRound className="h-5 w-5" />}
          title="Account credentials"
          description="Login details for the employee portal."
        >
          <div className="space-y-4">
            <div>
              <WorkforceLabel htmlFor="w-username">Username</WorkforceLabel>
              <WorkforceInput
                id="w-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="login username"
                autoComplete="off"
              />
            </div>
            <div>
              <WorkforceLabel htmlFor="w-email">Email</WorkforceLabel>
              <WorkforceInput
                id="w-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="email@factory.com"
              />
            </div>
            <div>
              <WorkforceLabel htmlFor="w-password">Temporary password</WorkforceLabel>
              <WorkforceInput
                id="w-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Min. 6 characters"
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          icon={<User className="h-5 w-5" />}
          title="Personal details"
          description="Contact information and emergency contacts."
        >
          <div className="space-y-4">
            <div>
              <WorkforceLabel htmlFor="w-fullname">Full name</WorkforceLabel>
              <WorkforceInput
                id="w-fullname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="First and last name"
              />
            </div>
            <div>
              <WorkforceLabel htmlFor="w-phone">Phone number</WorkforceLabel>
              <WorkforceInput
                id="w-phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+251 9xx xxx xxx"
              />
            </div>
            <div>
              <WorkforceLabel htmlFor="w-emergency">
                Emergency contact
              </WorkforceLabel>
              <WorkforceInput
                id="w-emergency"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="Name and phone number"
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          icon={<Briefcase className="h-5 w-5" />}
          title="Employment"
          description="Job role, department, and compensation."
        >
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <WorkforceLabel htmlFor="w-empid">
                  Employee ID (optional)
                </WorkforceLabel>
                <WorkforceInput
                  id="w-empid"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="Auto-generated if empty"
                />
              </div>
              <div>
                <WorkforceLabel htmlFor="w-dept">Department</WorkforceLabel>
                <WorkforceSelect
                  id="w-dept"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="">No department</option>
                  {departments.map((dept: { id: string; name: string }) => (
                    <option key={dept.id} value={dept.name}>
                      {dept.name}
                    </option>
                  ))}
                </WorkforceSelect>
              </div>
            </div>
            <div>
              <WorkforceLabel htmlFor="w-position">Position / job title</WorkforceLabel>
              <WorkforceInput
                id="w-position"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Machine Operator, QA Inspector"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <WorkforceLabel htmlFor="w-salary">Monthly salary</WorkforceLabel>
                <WorkforceInput
                  id="w-salary"
                  type="number"
                  min="0"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <WorkforceLabel htmlFor="w-skill">Skill level</WorkforceLabel>
                <WorkforceSelect
                  id="w-skill"
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value)}
                >
                  {["Junior", "Intermediate", "Expert"].map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </WorkforceSelect>
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection
          icon={<Shield className="h-5 w-5" />}
          title="Access & scheduling"
          description="System roles and optional first shift assignment."
        >
          <div className="space-y-4">
            <div>
              <WorkforceLabel>System roles</WorkforceLabel>
              <div className="mt-2 flex flex-wrap gap-2">
                {roleOptions.map((role) => {
                  const selected = roles.includes(role);
                  return (
                    <button
                      type="button"
                      key={role}
                      onClick={() => toggleRole(role)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        selected
                          ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50"
                      }`}
                    >
                      {role.replace(/_/g, " ")}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Select one or more roles. WORKER is typical for floor staff.
              </p>
            </div>
            <div>
              <WorkforceLabel htmlFor="w-shift">
                Initial shift (optional)
              </WorkforceLabel>
              <WorkforceSelect
                id="w-shift"
                value={shiftId}
                onChange={(e) => setShiftId(e.target.value)}
              >
                <option value="">No shift assigned</option>
                {shifts.map((shift: { id: string; name: string; startTime: string; endTime: string }) => (
                  <option key={shift.id} value={shift.id}>
                    {shift.name} ({shift.startTime} – {shift.endTime})
                  </option>
                ))}
              </WorkforceSelect>
            </div>
          </div>
        </FormSection>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
        <WorkforceButton
          type="button"
          variant="secondary"
          onClick={() => {
            setUsername("");
            setEmail("");
            setPassword("");
            setEmployeeId("");
            setFullName("");
            setJobTitle("");
            setSalary("");
            setPhoneNumber("");
            setEmergencyContact("");
            setSkillLevel("Intermediate");
            setDepartment("");
            setShiftId("");
            setRoles(["WORKER"]);
          }}
        >
          Clear form
        </WorkforceButton>
        <WorkforceButton type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Registering…" : "Register employee"}
        </WorkforceButton>
      </div>
    </form>
  );
}
