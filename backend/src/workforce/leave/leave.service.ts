/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
        workerId: data.workerId,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        status: 'PENDING',
      },
      include: {
        worker: {
          include: {
            user: {
              select: { username: true, email: true },
            },
          },
        },
      },
    });
  }

  async findPending() {
    return this.prisma.leaveRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        worker: {
          include: {
            user: { select: { username: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPendingForManager(managerId: string) {
    // Get manager's department
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      include: { workerProfile: true },
    });

    if (!manager || !manager.workerProfile) {
      return [];
    }

    const department = manager.workerProfile.department;

    return this.prisma.leaveRequest.findMany({
      where: {
        status: 'PENDING',
        worker: {
          department: { equals: department },
        },
      },
      include: {
        worker: {
          include: {
            user: { select: { username: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async canManagerApprove(
    leaveId: string,
    managerId: string,
  ): Promise<boolean> {
    // Get manager's department
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      include: { workerProfile: true },
    });

    if (!manager || !manager.workerProfile) {
      return false;
    }

    const department = manager.workerProfile.department;

    const leave = await this.prisma.leaveRequest.findFirst({
      where: {
        id: leaveId,
        worker: {
          department: department,
        },
      },
    });

    return !!leave;
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
      include: {
        worker: {
          include: {
            user: { select: { username: true, email: true } },
          },
        },
      },
    });
  }

  async getWorkforceAnalytics(managerId?: string) {
    let department: string | undefined;

    if (managerId) {
      const manager = await this.prisma.user.findUnique({
        where: { id: managerId },
        include: { workerProfile: true },
      });
      department = manager?.workerProfile?.department || undefined;
    }

    const whereCondition = department ? { worker: { department } } : {};

    const totalWorkers = await this.prisma.workerProfile.count({
      where: department ? { department } : {},
    });

    const activeLeaves = await this.prisma.leaveRequest.count({
      where: {
        status: 'APPROVED',
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
        ...whereCondition,
      },
    });

    const pendingLeaves = await this.prisma.leaveRequest.count({
      where: {
        status: 'PENDING',
        ...whereCondition,
      },
    });

    const approvedLeaves = await this.prisma.leaveRequest.count({
      where: {
        status: 'APPROVED',
        ...whereCondition,
      },
    });

    const rejectedLeaves = await this.prisma.leaveRequest.count({
      where: {
        status: 'REJECTED',
        ...whereCondition,
      },
    });

    // Leave requests by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentLeaves = await this.prisma.leaveRequest.findMany({
      where: {
        createdAt: { gte: sixMonthsAgo },
        ...whereCondition,
      },
      select: {
        createdAt: true,
        status: true,
      },
    });

    return {
      totalWorkers,
      activeLeaves,
      pendingLeaves,
      approvedLeaves,
      rejectedLeaves,
      availableWorkers: totalWorkers - activeLeaves,
      monthlyLeaves: this.groupLeavesByMonth(recentLeaves),
    };
  }

  async getEmployeeLeaveHistory(workerId: string) {
    return this.prisma.leaveRequest.findMany({
      where: { workerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private groupLeavesByMonth(leaves: any[]) {
    const monthlyData: { [key: string]: number } = {};

    leaves.forEach((leave) => {
      const month = leave.createdAt.toLocaleString('default', {
        month: 'short',
      });
      if (!monthlyData[month]) {
        monthlyData[month] = 0;
      }
      monthlyData[month]++;
    });

    return Object.entries(monthlyData).map(([month, count]) => ({
      month,
      count,
    }));
  }
}
