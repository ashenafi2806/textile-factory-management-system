import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HiringStatus } from '@prisma/client';
import { isHrOrAdminUser } from '../../auth/utils/role.utils';

const hiringInclude = {
  requestedBy: {
    select: {
      id: true,
      username: true,
      email: true,
      workerProfile: { select: { fullName: true, department: true } },
    },
  },
  approvedBy: {
    select: {
      id: true,
      username: true,
      workerProfile: { select: { fullName: true } },
    },
  },
} as const;

@Injectable()
export class HiringService {
  constructor(private prisma: PrismaService) {}

  private async resolveManagerDepartment(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { workerProfile: true },
    });
    return user?.workerProfile?.department ?? undefined;
  }

  private resolveReqDepartment(req: {
    department?: string | null;
    requestedBy?: {
      workerProfile?: { department?: string | null } | null;
    } | null;
  }) {
    return req.department ?? req.requestedBy?.workerProfile?.department ?? null;
  }

  private isHrOrAdmin(roles: string[] = []) {
    return isHrOrAdminUser({ roles });
  }

  async getAll(
    status?: HiringStatus,
    userId?: string,
    roles: string[] = [],
  ) {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    if (!this.isHrOrAdmin(roles) && userId) {
      const department = await this.resolveManagerDepartment(userId);
      if (department) {
        where.department = department;
      } else {
        where.requestedById = userId;
      }
    }

    return this.prisma.hiringRequisition.findMany({
      where,
      include: hiringInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    const record = await this.prisma.hiringRequisition.findUnique({
      where: { id },
      include: hiringInclude,
    });
    if (!record) throw new NotFoundException('Hiring requisition not found');
    return record;
  }

  async create(payload: {
    role: string;
    headcount: number;
    notes?: string;
    department?: string;
    requiredBy?: string;
    requestedById?: string;
  }) {
    let department = payload.department?.trim() || undefined;
    if (!department && payload.requestedById) {
      department = await this.resolveManagerDepartment(payload.requestedById);
    }

    return this.prisma.hiringRequisition.create({
      data: {
        role: payload.role.trim(),
        headcount: payload.headcount,
        notes: payload.notes?.trim() || undefined,
        department,
        requiredBy: payload.requiredBy
          ? new Date(payload.requiredBy)
          : undefined,
        requestedById: payload.requestedById ?? undefined,
        status: HiringStatus.OPEN,
      },
      include: hiringInclude,
    });
  }

  async approve(id: string, approverId?: string, roles: string[] = []) {
    const existing = await this.getById(id);
    if (existing.status !== HiringStatus.OPEN) {
      throw new ForbiddenException('Only open requisitions can be approved');
    }

    const resolvedDepartment =
      existing.department ??
      existing.requestedBy?.workerProfile?.department ??
      (approverId ? await this.resolveManagerDepartment(approverId) : undefined);

    if (!this.isHrOrAdmin(roles) && approverId) {
      const managerDept = await this.resolveManagerDepartment(approverId);
      if (!managerDept) {
        throw new ForbiddenException(
          'Your manager profile has no department. Ask HR to assign one before approving.',
        );
      }
      const effectiveReqDept =
        this.resolveReqDepartment(existing) ?? managerDept;
      if (effectiveReqDept !== managerDept) {
        throw new ForbiddenException(
          'You can only approve requisitions for your own department',
        );
      }
    }

    const now = new Date();
    return this.prisma.hiringRequisition.update({
      where: { id },
      data: {
        status: HiringStatus.APPROVED,
        department: resolvedDepartment ?? undefined,
        approvedById: approverId ?? undefined,
        approvedAt: now,
        rejectedAt: null,
      },
      include: hiringInclude,
    });
  }

  async reject(id: string, approverId?: string, roles: string[] = []) {
    const existing = await this.getById(id);
    if (existing.status !== HiringStatus.OPEN) {
      throw new ForbiddenException('Only open requisitions can be rejected');
    }

    const reqDepartment = this.resolveReqDepartment(existing);

    if (!this.isHrOrAdmin(roles) && approverId) {
      const managerDept = await this.resolveManagerDepartment(approverId);
      if (!managerDept) {
        throw new ForbiddenException(
          'Your manager profile has no department. Ask HR to assign one before rejecting.',
        );
      }
      const effectiveReqDept = reqDepartment ?? managerDept;
      if (effectiveReqDept !== managerDept) {
        throw new ForbiddenException(
          'You can only reject requisitions for your own department',
        );
      }
    }

    const now = new Date();
    return this.prisma.hiringRequisition.update({
      where: { id },
      data: {
        status: HiringStatus.REJECTED,
        approvedById: approverId ?? undefined,
        rejectedAt: now,
        approvedAt: null,
      },
      include: hiringInclude,
    });
  }
}
