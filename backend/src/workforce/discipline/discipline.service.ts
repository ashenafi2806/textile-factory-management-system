import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DisciplinaryCategory,
  DisciplinaryStatus,
  IncidentSeverity,
} from '@prisma/client';

@Injectable()
export class DisciplineService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filters?: { status?: DisciplinaryStatus; workerId?: string }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.workerId) where.workerId = filters.workerId;
    return this.prisma.disciplinaryAction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        worker: { include: { user: true } },
        issuedBy: { select: { id: true, username: true, email: true } },
        acknowledgedBy: { select: { id: true, username: true, email: true } },
      },
    });
  }

  async getOne(id: string) {
    const action = await this.prisma.disciplinaryAction.findUnique({
      where: { id },
      include: {
        worker: { include: { user: true } },
        issuedBy: { select: { id: true, username: true, email: true } },
        acknowledgedBy: { select: { id: true, username: true, email: true } },
      },
    });
    if (!action) throw new NotFoundException('Disciplinary action not found');
    return action;
  }

  async create(payload: {
    workerId: string;
    category: DisciplinaryCategory;
    severity?: IncidentSeverity;
    subject: string;
    reason?: string;
    notes?: string;
    effectiveDate?: string;
    expiresAt?: string;
    issuedById: string;
  }) {
    const data: any = {
      workerId: payload.workerId,
      category: payload.category,
      severity: payload.severity ?? 'LOW',
      subject: payload.subject,
      reason: payload.reason ?? null,
      notes: payload.notes ?? null,
      issuedById: payload.issuedById,
    };
    if (payload.effectiveDate) data.effectiveDate = new Date(payload.effectiveDate);
    if (payload.expiresAt) data.expiresAt = new Date(payload.expiresAt);
    return this.prisma.disciplinaryAction.create({
      data,
      include: {
        worker: { include: { user: true } },
        issuedBy: { select: { id: true, username: true, email: true } },
      },
    });
  }

  async update(
    id: string,
    payload: {
      status?: DisciplinaryStatus;
      notes?: string;
      reason?: string;
    },
  ) {
    return this.prisma.disciplinaryAction.update({
      where: { id },
      data: payload,
    });
  }

  async acknowledge(id: string, userId: string) {
    return this.prisma.disciplinaryAction.update({
      where: { id },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
        acknowledgedById: userId,
      },
    });
  }

  async revoke(id: string) {
    return this.prisma.disciplinaryAction.update({
      where: { id },
      data: { status: 'REVOKED' },
    });
  }
}
