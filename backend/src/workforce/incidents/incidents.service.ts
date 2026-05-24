import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class IncidentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(filters?: { status?: string; severity?: string }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.severity) where.severity = filters.severity;

    return this.prisma.incident.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOne(id: string) {
    return this.prisma.incident.findUnique({ where: { id } });
  }

  async create(payload: any) {
    const data: any = {
      title: payload.title,
      description: payload.description ?? null,
      severity: payload.severity ?? 'LOW',
      reportedById: payload.reportedBy,
      workerId: payload.workerId ?? null,
    };

    return this.prisma.incident.create({ data });
  }

  async approve(id: string, approverId: string) {
    return this.prisma.incident.update({
      where: { id },
      data: {
        status: 'REVIEWED',
        approvedById: approverId,
        approvedAt: new Date(),
      },
    });
  }
}
