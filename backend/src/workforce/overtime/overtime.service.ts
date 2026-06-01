import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OvertimeService {
  constructor(private prisma: PrismaService) {}

  async getPending() {
    return this.prisma.overtimeRequest.findMany({
      where: { status: 'PENDING' },
    });
  }

  async create(payload: {
    workerId: string;
    hours: number;
    reason?: string;
    createdById?: string;
  }) {
    return this.prisma.overtimeRequest.create({
      data: {
        workerId: payload.workerId,
        hours: payload.hours,
        reason: payload.reason ?? undefined,
        createdById: payload.createdById ?? undefined,
        status: 'PENDING',
      },
    });
  }

  async approve(id: string, approverId?: string) {
    const now = new Date();
    return this.prisma.overtimeRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: approverId ?? undefined,
        approvedAt: now,
      },
    });
  }

  async reject(id: string, approverId?: string) {
    const now = new Date();
    return this.prisma.overtimeRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedById: approverId ?? undefined,
        rejectedAt: now,
      },
    });
  }
}

// default export removed to keep named exports consistent
