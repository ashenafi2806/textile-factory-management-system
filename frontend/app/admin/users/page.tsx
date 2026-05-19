"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";

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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    roles: [] as string[],
  });
  const [errorMsg, setErrorMsg] = useState("");

  const {
    data: users,
    isLoading,
    error,
  } = useQuery({
    queryFn: async (): Promise<UserRecord[]> => {
      const res = await api.get("/users");
      return res.data;
    },
    queryKey: ["users"],
    enabled: Boolean(user),
    retry: false,
  });

  const createUserMutation = useMutation<UserRecord, any, CreateUserPayload>({
    mutationFn: async (payload) => {
      const res = await api.post("/users", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setForm({ username: "", email: "", password: "", roles: [] });
      setErrorMsg("");
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.message || "Unable to create user");
    },
  });

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!user.roles.includes("ADMIN") && !user.roles.includes("HR_ADMIN")) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Access denied</h1>
          <p className="mt-4 text-slate-600">
            You do not have permission to manage users.
          </p>
        </div>
      </div>
    );
  }

  const handleRoleChange = (role: string) => {
    setForm((prev) => {
      const hasRole = prev.roles.includes(role);
      return {
        ...prev,
        roles: hasRole
          ? prev.roles.filter((item) => item !== role)
          : [...prev.roles, role],
      };
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !form.username ||
      !form.email ||
      !form.password ||
      form.roles.length === 0
    ) {
      setErrorMsg(
        "Username, email, password, and at least one role are required.",
      );
      return;
    }

    await createUserMutation.mutateAsync({
      username: form.username,
      email: form.email,
      password: form.password,
      roles: form.roles,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-black text-slate-900">
            User Management
          </h1>
          <p className="mt-2 text-slate-600">
            Create new users and manage authentication roles.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Existing Users
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  List of users with assigned roles.
                </p>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-slate-900">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Username</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Roles</th>
                    <th className="px-4 py-3 font-semibold">Verified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-6 text-center text-slate-500"
                      >
                        Loading users...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-6 text-center text-rose-600"
                      >
                        Error loading users.
                      </td>
                    </tr>
                  ) : users?.length ? (
                    users.map((u: any) => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="px-4 py-4 font-medium text-slate-900">
                          {u.username}
                        </td>
                        <td className="px-4 py-4">{u.email}</td>
                        <td className="px-4 py-4">
                          {u.roles.map((role: any) => role.name).join(", ")}
                        </td>
                        <td className="px-4 py-4">
                          {u.isVerified ? "Yes" : "No"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-6 text-center text-slate-500"
                      >
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Create User</h2>
            <p className="mt-1 text-sm text-slate-500">
              Assign one or more roles when creating a new account.
            </p>

            <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Username
                </label>
                <input
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                  placeholder="username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                  placeholder="email@example.com"
                  type="email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                  placeholder="password"
                  type="password"
                />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700">Roles</p>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {roleOptions.map((role) => (
                    <label
                      key={role}
                      className="flex items-center gap-2 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 hover:border-indigo-300"
                    >
                      <input
                        type="checkbox"
                        checked={form.roles.includes(role)}
                        onChange={() => handleRoleChange(role)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{role}</span>
                    </label>
                  ))}
                </div>
              </div>

              {errorMsg ? (
                <p className="text-sm text-rose-600">{errorMsg}</p>
              ) : null}

              <button
                type="submit"
                className="inline-flex w-full justify-center rounded-3xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending ? "Creating..." : "Create User"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
