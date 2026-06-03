import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HiringStatus } from '@prisma/client';
import { isHrOrAdminUser } from '../../auth/utils/role.utils';

type PositionGap = {
  position: string;
  approved: number;
  current: number;
  gap: number;
};

type DepartmentDashboard = {
  department: string;
  headcount: number;
  openRequisitions: number;
  approvedToHire: number;
  workersByPosition: Record<string, number>;
  approvedPositions: Array<{ position: string; count: number }>;
  pendingByRole: Array<{ position: string; count: number }>;
  gaps: PositionGap[];
  recommendations: string[];
};

@Injectable()
export class StaffingService {
  constructor(private prisma: PrismaService) {}

  private async resolveManagerDepartment(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { workerProfile: true },
    });
    return user?.workerProfile?.department ?? undefined;
  }

  private countByRole(
    rows: Array<{ role: string; headcount: number }>,
  ): Record<string, number> {
    return rows.reduce<Record<string, number>>((acc, row) => {
      const key = row.role || 'Unknown';
      acc[key] = (acc[key] ?? 0) + row.headcount;
      return acc;
    }, {});
  }

  private resolveReqDepartment(req: {
    department?: string | null;
    requestedBy?: {
      workerProfile?: { department?: string | null } | null;
    } | null;
  }): string | null {
    return req.department ?? req.requestedBy?.workerProfile?.department ?? null;
  }

  private async listRequisitionsForDepartment(
    department: string,
    status: HiringStatus,
  ) {
    const rows = await this.prisma.hiringRequisition.findMany({
      where: { status },
      include: {
        requestedBy: {
          select: {
            workerProfile: { select: { department: true } },
          },
        },
      },
    });
    return rows.filter((r) => this.resolveReqDepartment(r) === department);
  }

  private async collectDepartmentNames() {
    const [registeredDepts, workerDeptGroups, hiringReqs] = await Promise.all([
      this.prisma.department.findMany({ select: { name: true } }),
      this.prisma.workerProfile.groupBy({
        by: ['department'],
        where: { department: { not: null } },
        _count: { _all: true },
      }),
      this.prisma.hiringRequisition.findMany({
        include: {
          requestedBy: {
            select: {
              workerProfile: { select: { department: true } },
            },
          },
        },
      }),
    ]);

    const names = new Set<string>();
    registeredDepts.forEach((d) => names.add(d.name));
    workerDeptGroups.forEach((g) => {
      if (g.department) names.add(g.department);
    });
    hiringReqs.forEach((r) => {
      const dept = this.resolveReqDepartment(r);
      if (dept) names.add(dept);
    });

    return [...names].sort();
  }

  private toPositionList(map: Record<string, number>) {
    return Object.entries(map)
      .map(([position, count]) => ({ position, count }))
      .sort((a, b) => b.count - a.count);
  }

  private buildRecommendations(
    department: string,
    gaps: PositionGap[],
    openCount: number,
  ): string[] {
    const recommendations: string[] = [];
    if (gaps.length > 0) {
      for (const gap of gaps.slice(0, 5)) {
        recommendations.push(
          `Priority hire: ${gap.gap} ${gap.position.replace(/_/g, ' ')} in ${department} (${gap.current} currently on staff)`,
        );
      }
    }
    if (openCount > 0) {
      recommendations.push(
        `${openCount} requisition(s) awaiting HR approval — review hiring requests`,
      );
    }
    if (recommendations.length === 0) {
      recommendations.push(
        'Staffing levels look healthy. No approved hiring backlog or critical gaps.',
      );
    }
    return recommendations;
  }

  async getDepartmentDashboard(
    department: string,
  ): Promise<DepartmentDashboard> {
    const workers = await this.prisma.workerProfile.findMany({
      where: { department },
      select: { position: true },
    });

    const workersByPosition = workers.reduce<Record<string, number>>(
      (acc, worker) => {
        const pos = worker.position || 'Unassigned';
        acc[pos] = (acc[pos] ?? 0) + 1;
        return acc;
      },
      {},
    );

    const [openReqs, approvedReqs] = await Promise.all([
      this.listRequisitionsForDepartment(department, HiringStatus.OPEN),
      this.listRequisitionsForDepartment(department, HiringStatus.APPROVED),
    ]);

    const pendingByRoleMap = this.countByRole(openReqs);
    const approvedToHireMap = this.countByRole(approvedReqs);

    const gaps: PositionGap[] = Object.entries(approvedToHireMap)
      .map(([position, approved]) => {
        const current = workersByPosition[position] ?? 0;
        return {
          position,
          approved,
          current,
          gap: approved,
        };
      })
      .filter((g) => g.gap > 0)
      .sort((a, b) => b.gap - a.gap);

    const approvedToHire = Object.values(approvedToHireMap).reduce(
      (sum, n) => sum + n,
      0,
    );

    return {
      department,
      headcount: workers.length,
      openRequisitions: openReqs.length,
      approvedToHire,
      workersByPosition,
      approvedPositions: this.toPositionList(approvedToHireMap),
      pendingByRole: this.toPositionList(pendingByRoleMap),
      gaps,
      recommendations: this.buildRecommendations(
        department,
        gaps,
        openReqs.length,
      ),
    };
  }

  async getOrgDashboard() {
    const departmentNames = await this.collectDepartmentNames();

    const departments = await Promise.all(
      departmentNames.map((name) => this.getDepartmentDashboard(name)),
    );

    const totalHeadcount = departments.reduce((sum, d) => sum + d.headcount, 0);
    const totalOpenRequisitions = departments.reduce(
      (sum, d) => sum + d.openRequisitions,
      0,
    );
    const totalApprovedToHire = departments.reduce(
      (sum, d) => sum + d.approvedToHire,
      0,
    );
    const allGaps = departments.flatMap((d) =>
      d.gaps.map((g) => ({ ...g, department: d.department })),
    );

    return {
      scope: 'organization' as const,
      department: null,
      headcount: totalHeadcount,
      openRequisitions: totalOpenRequisitions,
      approvedToHire: totalApprovedToHire,
      departments,
      gaps: allGaps,
      workersByPosition: departments.reduce<Record<string, number>>(
        (acc, dept) => {
          for (const [pos, count] of Object.entries(dept.workersByPosition)) {
            acc[pos] = (acc[pos] ?? 0) + count;
          }
          return acc;
        },
        {},
      ),
      approvedPositions: this.toPositionList(
        allGaps.reduce<Record<string, number>>((acc, g) => {
          acc[g.position] = (acc[g.position] ?? 0) + g.gap;
          return acc;
        }, {}),
      ),
      pendingByRole: this.toPositionList(
        departments.reduce<Record<string, number>>((acc, dept) => {
          for (const item of dept.pendingByRole) {
            acc[item.position] = (acc[item.position] ?? 0) + item.count;
          }
          return acc;
        }, {}),
      ),
      recommendations:
        allGaps.length > 0
          ? [
              `${allGaps.length} approved hiring gap(s) across ${departments.filter((d) => d.gaps.length > 0).length} department(s)`,
              ...allGaps.slice(0, 4).map(
                (g) =>
                  `${g.department}: hire ${g.gap} ${g.position.replace(/_/g, ' ')}`,
              ),
            ]
          : ['Organization staffing is on track. No approved hiring backlog.'],
    };
  }

  async getDashboard(userId: string, roles: string[] = [], department?: string) {
    if (department) {
      return this.getDepartmentDashboard(department);
    }

    if (isHrOrAdminUser({ roles })) {
      return this.getOrgDashboard();
    }

    const managerDepartment = await this.resolveManagerDepartment(userId);
    if (!managerDepartment) {
      return {
        scope: 'department' as const,
        message:
          'No department is assigned to your profile. Contact HR to link your account to a department.',
        department: null,
        headcount: 0,
        openRequisitions: 0,
        approvedToHire: 0,
        workersByPosition: {},
        approvedPositions: [],
        pendingByRole: [],
        gaps: [],
        recommendations: [
          'Assign a department to your manager profile to view staffing data.',
        ],
      };
    }

    return {
      scope: 'department' as const,
      ...(await this.getDepartmentDashboard(managerDepartment)),
    };
  }

  async findGaps(userId: string, roles: string[] = [], department?: string) {
    const dashboard = await this.getDashboard(userId, roles, department);
    return 'gaps' in dashboard ? dashboard.gaps : [];
  }

  async getHeadcount(userId: string, roles: string[] = [], department?: string) {
    const dashboard = await this.getDashboard(userId, roles, department);
    return {
      department: 'department' in dashboard ? dashboard.department : null,
      scope: 'scope' in dashboard ? dashboard.scope : 'department',
      totalHeadcount: dashboard.headcount ?? 0,
      byPosition: dashboard.workersByPosition ?? {},
      openRequisitions: dashboard.openRequisitions ?? 0,
      approvedToHire: dashboard.approvedToHire ?? 0,
    };
  }
}
