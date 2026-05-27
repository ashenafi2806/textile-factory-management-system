import { Injectable } from '@nestjs/common';

type OvertimeRequest = {
  id: string;
  workerId: string;
  hours: number;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
};

@Injectable()
export class OvertimeService {
  private requests: OvertimeRequest[] = [];

  getPending() {
    return this.requests.filter((r) => r.status === 'PENDING');
  }

  create(payload: Partial<OvertimeRequest>) {
    const id = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const req: OvertimeRequest = {
      id,
      workerId: payload.workerId ?? 'unknown',
      hours: payload.hours ?? 0,
      reason: payload.reason ?? '',
      status: 'PENDING',
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
