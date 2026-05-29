import { Injectable } from '@nestjs/common';

type HiringRequest = {
  id: string;
  role: string;
  headcount: number;
  notes?: string;
  department?: string;
  requiredBy?: string;
  status: 'OPEN' | 'APPROVED' | 'REJECTED';
  createdBy?: string;
  createdAt: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
};

@Injectable()
export class HiringService {
  private requests: HiringRequest[] = [];

  getAll(status?: 'OPEN' | 'APPROVED' | 'REJECTED') {
    if (!status) return this.requests;
    return this.requests.filter((r) => r.status === status);
  }

  getById(id: string) {
    return this.requests.find((r) => r.id === id) || null;
  }

  create(payload: Partial<HiringRequest>) {
    const id = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const req: HiringRequest = {
      id,
      role: payload.role ?? 'Unknown',
      headcount: payload.headcount ?? 1,
      notes: payload.notes ?? '',
      department: payload.department,
      requiredBy: payload.requiredBy,
      status: 'OPEN',
      createdBy: payload.createdBy ?? 'unknown',
      createdAt: new Date().toISOString(),
      approvedAt: null,
      rejectedAt: null,
    };
    this.requests.push(req);
    return req;
  }

  approve(id: string) {
    const r = this.requests.find((x) => x.id === id);
    if (!r) return null;
    if (r.status !== 'OPEN') return r; // already processed
    r.status = 'APPROVED';
    r.approvedAt = new Date().toISOString();
    return r;
  }

  reject(id: string) {
    const r = this.requests.find((x) => x.id === id);
    if (!r) return null;
    if (r.status !== 'OPEN') return r;
    r.status = 'REJECTED';
    r.rejectedAt = new Date().toISOString();
    return r;
  }
}

// default export removed to keep named exports consistent
