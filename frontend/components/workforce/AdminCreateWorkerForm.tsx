import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import workforceService from "@/services/workforceService";

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
  const [shiftDate, setShiftDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [roles, setRoles] = useState<string[]>(["WORKER"]);

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const worker = await workforceService.createWorker(payload);
      if (shiftId) {
        await workforceService.assignShift({
          workerId: worker.id,
          shiftId,
          date: shiftDate,
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
      setShiftDate(new Date().toISOString().slice(0, 10));
      setRoles(["WORKER"]);
      alert("Worker created successfully");
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return alert("Username is required");
    if (!email.trim()) return alert("Email is required");
    if (!password.trim()) return alert("Password is required");
    if (!fullName.trim()) return alert("Full name is required");
    if (!jobTitle.trim()) return alert("Position is required");

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
    <form onSubmit={submit} className="card p-4 space-y-4 w-full max-w-xl">
      <h3 className="text-xl font-semibold">Create Employee</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input mt-1 w-full"
            placeholder="login username"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="input mt-1 w-full"
            placeholder="email@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Full name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="input mt-1 w-full"
            placeholder="First and last name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="input mt-1 w-full"
            placeholder="temporary password"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Employee ID</label>
          <input
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="input mt-1 w-full"
            placeholder="Optional custom employee ID"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Position</label>
          <input
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="input mt-1 w-full"
            placeholder="Job title / role name"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Phone number</label>
          <input
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="input mt-1 w-full"
            placeholder="+251 9xx xxx xxx"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Emergency contact</label>
          <input
            value={emergencyContact}
            onChange={(e) => setEmergencyContact(e.target.value)}
            className="input mt-1 w-full"
            placeholder="Name / phone"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Salary</label>
          <input
            type="number"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            className="input mt-1 w-full"
            placeholder="Monthly salary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Skill level</label>
          <select
            value={skillLevel}
            onChange={(e) => setSkillLevel(e.target.value)}
            className="input mt-1 w-full"
          >
            {["Junior", "Intermediate", "Expert"].map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium">Roles</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {roleOptions.map((role) => (
            <button
              type="button"
              key={role}
              onClick={() =>
                setRoles((prev) =>
                  prev.includes(role)
                    ? prev.filter((item) => item !== role)
                    : [...prev, role],
                )
              }
              className={`rounded-3xl border px-4 py-3 text-sm font-semibold transition ${
                roles.includes(role)
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:border-indigo-300"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Department</label>
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="input mt-1 w-full"
            placeholder="Department (e.g. Production)"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">
            Shift assignment (optional)
          </label>
          <select
            value={shiftId}
            onChange={(e) => setShiftId(e.target.value)}
            className="input mt-1 w-full"
          >
            <option value="">No shift</option>
            {shifts.map((shift: any) => (
              <option key={shift.id} value={shift.id}>
                {shift.name} ({shift.startTime} - {shift.endTime})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Shift date</label>
          <input
            type="date"
            value={shiftDate}
            onChange={(e) => setShiftDate(e.target.value)}
            className="input mt-1 w-full"
          />
        </div>
      </div>

      <div>
        <button type="submit" className="btn" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating..." : "Create Employee"}
        </button>
      </div>
    </form>
  );
}
