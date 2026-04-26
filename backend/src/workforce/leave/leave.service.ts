import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LeaveStatus } from '@prisma/client';

@Injectable()
export class LeaveService {
  constructor(private prisma: PrismaService) {}

  async requestLeave(data: {
    workerId: string;
    startDate: Date;
    endDate: Date;
    reason: string;
  }) {
    return this.prisma.leaveRequest.create({
      data: {
        ...data,
        status: 'PENDING',
      },
    });
  }

  async findPending() {
    return this.prisma.leaveRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        worker: { include: { user: { select: { username: true } } } },
      },
    });
  }

  async approveLeave(id: string, approvedById: string, status: LeaveStatus) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!request) throw new NotFoundException('Leave request not found');

    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        approvedById,
      },
    });
  }

  async getWorkforceAnalytics() {
    const totalWorkers = await this.prisma.workerProfile.count();
    const activeLeaves = await this.prisma.leaveRequest.count({
      where: {
        status: 'APPROVED',
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    });

    // Simplified analytics
    return {
      totalWorkers,
      activeLeaves,
      availableWorkers: totalWorkers - activeLeaves,
    };
  }
}
