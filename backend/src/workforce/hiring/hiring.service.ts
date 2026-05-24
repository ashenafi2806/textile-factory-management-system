import { Injectable } from '@nestjs/common';

type HiringRequest = {
  id: string;
  role: string;
  headcount: number;
  notes?: string;
  status: 'OPEN' | 'APPROVED' | 'REJECTED';
  createdBy?: string;
  createdAt: string;
};

@Injectable()
export class HiringService {
  private requests: HiringRequest[] = [];

  getAll() {
    return this.requests;
  }

  create(payload: Partial<HiringRequest>) {
    const id = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const req: HiringRequest = {
      id,
      role: payload.role ?? 'Unknown',
      headcount: payload.headcount ?? 1,
      notes: payload.notes ?? '',
      status: 'OPEN',
      createdBy: payload.createdBy ?? 'unknown',
      createdAt: new Date().toISOString(),
    };
    this.requests.push(req);
    return req;
  }

  approve(id: string) {
    const r = this.requests.find((x) => x.id === id);
    if (!r) return null;
    r.status = 'APPROVED';
    return r;
  }
}

// default export removed to keep named exports consistent
