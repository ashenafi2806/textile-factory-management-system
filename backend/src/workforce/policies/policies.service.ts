import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PoliciesService {
  constructor(private prisma: PrismaService) {}

  async create(payload: {
    name: string;
    description?: string;
    workdayStart?: string;
    workdayEnd?: string;
    gracePeriodMinutes?: number;
    lateThresholdMinutes?: number;
    earlyLeaveThresholdMinutes?: number;
    overtimeEligible?: boolean;
    department?: string | null;
    createdById?: string | null;
  }) {
    return this.prisma.attendancePolicy.create({
      data: {
        name: payload.name,
        workdayStart: payload.workdayStart ?? undefined,
        workdayEnd: payload.workdayEnd ?? undefined,
        gracePeriodMinutes: payload.gracePeriodMinutes ?? 0,
        lateThresholdMinutes: payload.lateThresholdMinutes ?? 0,
        earlyLeaveThresholdMinutes: payload.earlyLeaveThresholdMinutes ?? 0,
        overtimeEligible: payload.overtimeEligible ?? true,
        department: payload.department ?? undefined,
        createdById: payload.createdById ?? undefined,
      },
    });
  }

  async findAll() {
    return this.prisma.attendancePolicy.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.attendancePolicy.findUnique({ where: { id } });
  }

  async update(id: string, payload: any) {
    return this.prisma.attendancePolicy.update({
      where: { id },
      data: payload,
    });
  }

  async remove(id: string) {
    return this.prisma.attendancePolicy.delete({ where: { id } });
  }
}

export default PoliciesService;
