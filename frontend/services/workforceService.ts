/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "@/lib/api";

export const workforceService = {
  getWorkers: () => api.get("/workforce/workers"),
  getPendingLeaves: () => api.get("/workforce/leave/pending"),
  getMyLeaves: () => api.get("/workforce/leave/my-leaves"),
  requestLeave: (payload: any) => api.post("/workforce/leave/request", payload),
  approveLeave: (id: string) => api.put(`/workforce/leave/${id}/approve`),
  getTeamAttendance: (teamId: string) =>
    api.get(`/workforce/attendance/team/${teamId}`),
  postAttendance: (payload: any) => api.post("/workforce/attendance", payload),
  getTeamSchedule: (teamId: string) =>
    api.get(`/workforce/shifts/team/${teamId}/schedule`),
  getStaffingDashboard: () => api.get("/workforce/staffing/dashboard"),
  // Overtime endpoints (may require backend implementation)
  getOvertimePending: () => api.get("/workforce/overtime/pending"),
  approveOvertime: (id: string) => api.put(`/workforce/overtime/${id}/approve`),
  // Hiring requisitions
  getHiringRequests: () => api.get("/workforce/hiring/requests"),
  createHiringRequest: (payload: any) =>
    api.post("/workforce/hiring/requisition", payload),
  approveHiringRequest: (id: string) =>
    api.put(`/workforce/hiring/${id}/approve`),
  // Incidents (dev stub)
  getIncidents: () => api.get("/workforce/incidents"),
  createIncident: (payload: any) => api.post("/workforce/incidents", payload),
  getIncident: (id: string) => api.get(`/workforce/incidents/${id}`),
  approveIncident: (id: string) =>
    api.put(`/workforce/incidents/${id}/approve`),
};

export default workforceService;
