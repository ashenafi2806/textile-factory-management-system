import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HiringService {
  constructor(private prisma: PrismaService) {}

  async getAll(status?: 'OPEN' | 'APPROVED' | 'REJECTED') {
    const where: any = {};
    if (status) where.status = status;
    return this.prisma.hiringRequisition.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    return this.prisma.hiringRequisition.findUnique({ where: { id } });
  }

  async create(payload: {
    role: string;
    headcount: number;
    notes?: string;
    department?: string;
    requiredBy?: string;
    requestedById?: string;
  }) {
    return this.prisma.hiringRequisition.create({
      data: {
        role: payload.role,
        headcount: payload.headcount,
        notes: payload.notes ?? undefined,
        department: payload.department ?? undefined,
        requiredBy: payload.requiredBy
          ? new Date(payload.requiredBy)
          : undefined,
        requestedById: payload.requestedById ?? undefined,
        status: 'OPEN',
      },
    });
  }

  async approve(id: string, approverId?: string) {
    const now = new Date();
    return this.prisma.hiringRequisition.update({
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
    return this.prisma.hiringRequisition.update({
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
