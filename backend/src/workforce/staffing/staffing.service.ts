/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StaffingService {
  constructor(private prisma: PrismaService) {}

  async getDashboardForManager(managerId: string) {
    // Get manager's worker profile to find their department
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      include: {
        workerProfile: true,
      },
    });

    const department = manager?.workerProfile?.department;
    if (!department) {
      return {
        message: 'No department assigned to this manager',
        headcount: 0,
        gaps: [],
        recommendations: [],
      };
    }

    const workers = await this.prisma.workerProfile.findMany({
      where: { department },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    const totalHeadcount = workers.length;
    const approvedPositions = await this.getApprovedPositions(department);

    const gaps = approvedPositions
      .map((pos) => ({
        position: pos.position,
        approved: pos.count,
        current: workers.filter((w) => w.position === pos.position).length,
        gap:
          pos.count - workers.filter((w) => w.position === pos.position).length,
      }))
      .filter((gap) => gap.gap > 0);

    return {
      department,
      headcount: totalHeadcount,
      approvedPositions,
      gaps,
      workersByPosition: this.groupByPosition(workers),
      recommendations: this.generateRecommendations(gaps),
    };
  }

  async findGapsForManager(managerId: string) {
    const dashboard = await this.getDashboardForManager(managerId);
    return dashboard.gaps;
  }

  async getHeadcountForManager(managerId: string) {
    const dashboard = await this.getDashboardForManager(managerId);
    return {
      department: dashboard.department,
      totalHeadcount: dashboard.headcount,
      byPosition: dashboard.workersByPosition,
    };
  }

  private async getApprovedPositions(department: string) {
    const dept = department?.toUpperCase();

    if (dept === 'PRODUCTION') {
      return [
        { position: 'PRODUCTION_WORKER', count: 50 },
        { position: 'SUPERVISOR', count: 5 },
        { position: 'QA_STAFF', count: 3 },
      ];
    }

    if (dept === 'MAINTENANCE') {
      return [
        { position: 'MAINTENANCE_TECHNICIAN', count: 10 },
        { position: 'MAINTENANCE_SUPERVISOR', count: 2 },
      ];
    }

    return [
      { position: 'WORKER', count: 20 },
      { position: 'SUPERVISOR', count: 3 },
    ];
  }

  private groupByPosition(workers: any[]) {
    return workers.reduce((acc: Record<string, any[]>, worker) => {
      const pos = worker.position;
      if (!acc[pos]) acc[pos] = [];
      acc[pos].push(worker);
      return acc;
    }, {});
  }

  private generateRecommendations(gaps: any[]) {
    const recommendations: string[] = [];
    for (const gap of gaps) {
      if (gap.gap > 0) {
        recommendations.push(
          `Hire ${gap.gap} more ${gap.position}(s) to meet approved headcount`,
        );
      }
    }
    if (recommendations.length === 0) {
      recommendations.push('Staffing levels are optimal');
    }
    return recommendations;
  }
}
