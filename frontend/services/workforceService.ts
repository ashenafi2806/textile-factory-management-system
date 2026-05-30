/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "@/lib/api";

export const workforceService = {
  getWorkers: () => api.get("/workforce/workers"),
  getPendingLeaves: () => api.get("/workforce/leave/pending"),
  getMyLeaves: () => api.get("/workforce/leave/my-leaves"),
  requestLeave: (payload: any) => api.post("/workforce/leave/request", payload),
  approveLeave: (id: string) => api.put(`/workforce/leave/${id}/approve`),
  getTeamAttendance: (teamId: string, date?: string) =>
    ((): any => {
      try {
        // eslint-disable-next-line no-console
        console.debug("workforceService.getTeamAttendance request", {
          teamId,
          date,
        });
      } catch (e) {}
      return api.get(`/workforce/attendance/team/${teamId}`, {
        params: { date },
      });
    })(),
  postAttendance: (payload: any) => api.post("/workforce/attendance", payload),
  getTeamSchedule: (teamId: string) =>
    api.get(`/workforce/shifts/team/${teamId}/schedule`),
  getShifts: () => api.get("/workforce/shifts"),
  assignShift: (payload: any) => api.post("/workforce/shifts/assign", payload),
  unassignShift: (id: string) => api.delete(`/workforce/shifts/assign/${id}`),
  getWorkerAssignments: (workerId: string, start?: string, end?: string) =>
    api.get(`/workforce/shifts/worker/${workerId}/assignments`, {
      params: { start, end },
    }),
  getMyShifts: (days?: number) =>
    api.get(`/workforce/shifts/my-shifts`, { params: { days } }),
  getMyCurrentShift: () => api.get("/workforce/shifts/my-current"),
  getTrainingMaterials: () => api.get("/training/materials"),
  getTrainingMaterial: (id: string) => api.get(`/training/materials/${id}`),
  getMe: () => api.get("/users/me"),
  updateMe: (payload: any) => api.patch("/users/me", payload),
  uploadProfilePicture: (file: File) => {
    const fd = new FormData();
    fd.append("photo", file);
    return api.post("/users/me/photo", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getStaffingDashboard: () => api.get("/workforce/staffing/dashboard"),
  // Overtime endpoints (may require backend implementation)
  getOvertimePending: () => api.get("/workforce/overtime/pending"),
  approveOvertime: (id: string) => api.put(`/workforce/overtime/${id}/approve`),
  rejectOvertime: (id: string) => api.put(`/workforce/overtime/${id}/reject`),
  // Hiring requisitions
  getHiringRequests: () => api.get("/workforce/hiring/requests"),
  getHiringRequest: (id: string) => api.get(`/workforce/hiring/requests/${id}`),
  createHiringRequest: (payload: any) =>
    api.post("/workforce/hiring/requisition", payload),
  approveHiringRequest: (id: string) =>
    api.put(`/workforce/hiring/${id}/approve`),
  rejectHiringRequest: (id: string) =>
    api.put(`/workforce/hiring/${id}/reject`),
  // Admin create endpoints
  createWorker: (payload: any) => api.post("/workforce/workers", payload),
  createDepartment: (payload: any) =>
    api.post("/workforce/departments", payload),
  createTeam: (departmentId: string, payload: any) =>
    api.post(`/workforce/departments/${departmentId}/teams`, payload),
  createShift: (payload: any) => api.post("/workforce/shifts", payload),
  updateAttendance: (id: string, payload: any) =>
    api.put(`/workforce/attendance/${id}`, payload),
  deleteAttendance: (id: string) => api.delete(`/workforce/attendance/${id}`),
  // Incidents (dev stub)
  getIncidents: () => api.get("/workforce/incidents"),
  createIncident: (payload: any) => api.post("/workforce/incidents", payload),
  getIncident: (id: string) => api.get(`/workforce/incidents/${id}`),
  approveIncident: (id: string) =>
    api.put(`/workforce/incidents/${id}/approve`),
};

export default workforceService;
