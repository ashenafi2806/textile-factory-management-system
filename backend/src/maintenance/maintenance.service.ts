import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceType,
  Prisma,
  TransactionType,
  ReferenceType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { ReportFailureDto } from './dto/report-failure.dto';
import { GetTasksQueryDto } from './dto/get-tasks-query.dto';

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async getMaintenanceTaskOrThrow(taskId: string) {
    try {
      return await this.prisma.maintenanceTask.findUniqueOrThrow({
        where: { id: taskId },
        include: {
          assignedTo: {
            include: { user: { select: { username: true, email: true } } },
          },
          reportedBy: { select: { username: true, email: true } },
          spareParts: {
            include: { item: { select: { name: true, unit: true } } },
          },
          failureReport: true,
        },
      });
    } catch {
      throw new NotFoundException('Task not found');
    }
  }

  async createTask(dto: CreateTaskDto, userId: string) {
    if (dto.assignedToId) {
      const technician = await this.prisma.workerProfile.findUnique({
        where: { id: dto.assignedToId },
      });

      if (!technician) {
        throw new NotFoundException('Technician not found');
      }
    }

    return this.prisma.maintenanceTask.create({
      data: {
        type: dto.type,
        priority: dto.priority ?? MaintenancePriority.NORMAL,
        equipmentName: dto.equipmentName,
        description: dto.description,
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : null,
        assignedToId: dto.assignedToId ?? null,
        reportedById: userId,
        status: MaintenanceStatus.OPEN,
      },
      include: {
        assignedTo: {
          include: { user: { select: { username: true, email: true } } },
        },
        reportedBy: { select: { username: true, email: true } },
      },
    });
  }

  async schedulePreventiveTask(dto: CreateTaskDto, userId: string) {
    if (dto.type !== MaintenanceType.PREVENTIVE) {
      throw new BadRequestException(
        'Managers schedule preventive maintenance only. Report failures via production/supervisor.',
      );
    }

    if (!dto.scheduledDate) {
      throw new BadRequestException(
        'Preventive maintenance requires a scheduled date',
      );
    }

    return this.createTask({ ...dto, type: MaintenanceType.PREVENTIVE }, userId);
  }

  private endOfToday(): Date {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return end;
  }

  private isPreventiveScheduledForFuture(task: {
    type: MaintenanceType;
    scheduledDate: Date | null;
  }) {
    return (
      task.type === MaintenanceType.PREVENTIVE &&
      task.scheduledDate &&
      task.scheduledDate > this.endOfToday()
    );
  }

  async assignTask(taskId: string, dto: AssignTaskDto) {
    const task = await this.getMaintenanceTaskOrThrow(taskId);

    if (task.status === MaintenanceStatus.COMPLETED) {
      throw new BadRequestException('Cannot reassign completed task');
    }

    if (task.status === MaintenanceStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        'Use approve-failure to accept a failure report and assign a technician',
      );
    }

    const technician = await this.prisma.workerProfile.findUnique({
      where: { id: dto.assignedToId },
    });

    if (!technician) {
      throw new NotFoundException('Technician not found');
    }

    const nextStatus = this.isPreventiveScheduledForFuture(task)
      ? MaintenanceStatus.OPEN
      : MaintenanceStatus.IN_PROGRESS;

    const updated = await this.prisma.maintenanceTask.update({
      where: { id: taskId },
      data: {
        assignedToId: dto.assignedToId,
        status: nextStatus,
      },
      include: {
        assignedTo: { include: { user: { select: { username: true } } } },
      },
    });

    await this.notificationsService.createForUsers([technician.userId], {
      title: `Maintenance assigned: ${task.equipmentName}`,
      message:
        nextStatus === MaintenanceStatus.OPEN && task.scheduledDate
          ? `Preventive work scheduled for ${task.scheduledDate.toLocaleDateString()}. You can start on that date.`
          : task.description,
      type: 'MAINTENANCE_ASSIGNED',
      urgent: task.priority === MaintenancePriority.CRITICAL,
    });

    return updated;
  }

  async approveFailureTask(taskId: string, dto: AssignTaskDto, managerId: string) {
    const task = await this.getMaintenanceTaskOrThrow(taskId);

    if (!task.failureReport) {
      throw new BadRequestException('This task is not a failure report');
    }

    if (task.status !== MaintenanceStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Failure has already been reviewed');
    }

    const technician = await this.prisma.workerProfile.findUnique({
      where: { id: dto.assignedToId },
    });

    if (!technician) {
      throw new NotFoundException('Technician not found');
    }

    const updated = await this.prisma.maintenanceTask.update({
      where: { id: taskId },
      data: {
        assignedToId: dto.assignedToId,
        status: MaintenanceStatus.IN_PROGRESS,
      },
      include: {
        assignedTo: { include: { user: { select: { username: true } } } },
        failureReport: true,
        reportedBy: { select: { username: true } },
      },
    });

    await this.notificationsService.createForUsers([technician.userId], {
      title: `Maintenance assigned: ${task.equipmentName}`,
      message: task.description,
      type: 'MAINTENANCE_ASSIGNED',
      urgent: task.priority === MaintenancePriority.CRITICAL,
    });

    return updated;
  }

  async startTask(taskId: string, userId: string) {
    const task = await this.getMaintenanceTaskOrThrow(taskId);
    const worker = await this.prisma.workerProfile.findUnique({ where: { userId } });

    if (!worker || task.assignedToId !== worker.id) {
      throw new BadRequestException('Only the assigned technician can start this task');
    }

    if (task.status !== MaintenanceStatus.OPEN) {
      throw new BadRequestException('Task is already started or closed');
    }

    if (this.isPreventiveScheduledForFuture(task)) {
      throw new BadRequestException(
        'Preventive work cannot start before the scheduled date',
      );
    }

    return this.prisma.maintenanceTask.update({
      where: { id: taskId },
      data: { status: MaintenanceStatus.IN_PROGRESS },
      include: {
        assignedTo: { include: { user: { select: { username: true } } } },
        failureReport: true,
      },
    });
  }

  async submitCompletion(taskId: string, dto: CompleteTaskDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const task = await tx.maintenanceTask.findUniqueOrThrow({
        where: { id: taskId },
        include: { assignedTo: { include: { user: true } } },
      });

      if (task.status === MaintenanceStatus.COMPLETED) {
        throw new BadRequestException('Task already completed');
      }

      if (task.status === MaintenanceStatus.PENDING_COMPLETION) {
        throw new BadRequestException('Completion already submitted for approval');
      }

      if (task.status !== MaintenanceStatus.IN_PROGRESS) {
        throw new BadRequestException(
          'Task must be in progress before submitting completion',
        );
      }

      const worker = await tx.workerProfile.findUnique({ where: { userId } });
      if (!worker || task.assignedToId !== worker.id) {
        throw new BadRequestException(
          'Only the assigned technician can submit completion',
        );
      }

      if (dto.spareParts?.length) {
        for (const sparePart of dto.spareParts) {
          await tx.maintenanceSparePart.create({
            data: {
              taskId,
              itemId: sparePart.itemId,
              quantityUsed: sparePart.quantityUsed,
              deducted: false,
            },
          });
        }
      }

      const updated = await tx.maintenanceTask.update({
        where: { id: taskId },
        data: {
          status: MaintenanceStatus.PENDING_COMPLETION,
          timeSpentMins: dto.timeSpentMins,
          notes: dto.notes,
        },
        include: {
          spareParts: {
            include: { item: { select: { name: true, unit: true } } },
          },
          assignedTo: { include: { user: { select: { username: true } } } },
        },
      });

      const managers = await tx.user.findMany({
        where: {
          roles: {
            some: {
              name: { in: ['MAINTENANCE_MANAGER', 'ADMIN'] as any },
            },
          },
        },
        select: { id: true },
      });

      await this.notificationsService.createForUsers(
        managers.map((m) => m.id),
        {
          title: `Completion pending approval: ${task.equipmentName}`,
          message: `Technician ${task.assignedTo?.user?.username ?? 'unknown'} submitted work for review.`,
          type: 'MAINTENANCE_COMPLETION_PENDING',
          urgent: false,
        },
      );

      return updated;
    });
  }

  async approveCompletion(taskId: string, managerId: string) {
    return this.prisma.$transaction(async (tx) => {
      const task = await tx.maintenanceTask.findUniqueOrThrow({
        where: { id: taskId },
        include: {
          spareParts: { include: { item: true } },
          assignedTo: { include: { user: true } },
        },
      });

      if (task.status !== MaintenanceStatus.PENDING_COMPLETION) {
        throw new BadRequestException('No completion submission awaiting approval');
      }

      const pendingParts = task.spareParts.filter((p) => !p.deducted);

      for (const sparePart of pendingParts) {
        const item = sparePart.item;
        if (item.quantity < sparePart.quantityUsed) {
          throw new BadRequestException(
            `Insufficient stock for ${item.name}: ${item.quantity} ${item.unit} available`,
          );
        }

        await tx.inventoryItem.update({
          where: { id: sparePart.itemId },
          data: { quantity: { decrement: sparePart.quantityUsed } },
        });

        await tx.inventoryTransaction.create({
          data: {
            itemId: sparePart.itemId,
            type: TransactionType.ISSUE,
            quantity: sparePart.quantityUsed,
            performedById: managerId,
            referenceId: taskId,
            referenceType: ReferenceType.MAINTENANCE_TASK,
            note: `Spare part used in maintenance: ${task.equipmentName}`,
          },
        });

        await tx.maintenanceSparePart.update({
          where: { id: sparePart.id },
          data: { deducted: true },
        });
      }

      const updated = await tx.maintenanceTask.update({
        where: { id: taskId },
        data: {
          status: MaintenanceStatus.COMPLETED,
          completedAt: new Date(),
        },
        include: {
          spareParts: {
            include: { item: { select: { name: true, unit: true } } },
          },
          assignedTo: { include: { user: { select: { username: true } } } },
        },
      });

      if (task.assignedTo?.userId) {
        await this.notificationsService.createForUsers([task.assignedTo.userId], {
          title: `Task approved: ${task.equipmentName}`,
          message: 'Your maintenance work has been approved and closed.',
          type: 'MAINTENANCE_COMPLETED',
          urgent: false,
        });
      }

      return updated;
    });
  }

  /** @deprecated Use submitCompletion (technician) + approveCompletion (manager) */
  async completeTask(taskId: string, dto: CompleteTaskDto, userId: string) {
    return this.submitCompletion(taskId, dto, userId);
  }

  async createSparePartRequisition(
    taskId: string,
    dto: { itemId: string; quantityRequested: number; purpose?: string },
    userId: string,
  ) {
    const client = this.prisma as any;
    const task = await this.getMaintenanceTaskOrThrow(taskId);
    const item = await client.inventoryItem.findUnique({
      where: { id: dto.itemId },
    });
    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }
    if (dto.quantityRequested <= 0) {
      throw new BadRequestException(
        'Requested quantity must be greater than zero',
      );
    }

    const requisition = await client.inventoryRequisition.create({
      data: {
        requestedById: userId,
        itemId: dto.itemId,
        quantityRequested: dto.quantityRequested,
        purpose: dto.purpose ?? `Maintenance Task ${task.equipmentName}`,
        referenceId: task.id,
      },
      include: {
        item: true,
        requestedBy: { select: { id: true, username: true, email: true } },
      },
    });

    const managers = await this.prisma.user.findMany({
      where: {
        roles: {
          some: { name: { in: ['MAINTENANCE_MANAGER', 'ADMIN'] as any } },
        },
      },
      select: { id: true },
    });

    await this.notificationsService.createForUsers(
      managers.map((m) => m.id),
      {
        title: `Spare parts requested: ${task.equipmentName}`,
        message: `${dto.quantityRequested} × ${item.name} requested for maintenance.`,
        type: 'MAINTENANCE_REQUISITION',
        urgent: false,
      },
    );

    return {
      ...requisition,
      task: {
        id: task.id,
        equipmentName: task.equipmentName,
        scheduledDate: task.scheduledDate,
        type: task.type,
        status: task.status,
      },
      availability: {
        available: item.quantity,
        requested: dto.quantityRequested,
        shortBy: Math.max(0, dto.quantityRequested - item.quantity),
        canFulfill: item.quantity >= dto.quantityRequested,
      },
    };
  }

  async getPlanningCalendar(params: { from?: string; to?: string }) {
    const tasks = await this.prisma.maintenanceTask.findMany({
      where: {
        scheduledDate: {
          gte: params.from ? new Date(params.from) : undefined,
          lte: params.to ? new Date(params.to) : undefined,
        },
      },
      include: {
        assignedTo: {
          include: { user: { select: { username: true, email: true } } },
        },
        reportedBy: { select: { username: true, email: true } },
        spareParts: {
          include: { item: { select: { name: true, unit: true } } },
        },
        failureReport: true,
      },
      orderBy: [{ scheduledDate: 'asc' }, { priority: 'desc' }],
    });

    const byDate = tasks.reduce<Record<string, typeof tasks>>((acc, task) => {
      const key = task.scheduledDate
        ? task.scheduledDate.toISOString().slice(0, 10)
        : 'unscheduled';
      acc[key] ??= [];
      acc[key].push(task);
      return acc;
    }, {});

    return {
      total: tasks.length,
      byDate,
      tasks,
    };
  }

  async reportFailure(dto: ReportFailureDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const task = await tx.maintenanceTask.create({
        data: {
          type: MaintenanceType.CORRECTIVE,
          priority: dto.priority ?? MaintenancePriority.NORMAL,
          equipmentName: dto.equipmentName,
          description: dto.description,
          reportedById: userId,
          status: MaintenanceStatus.PENDING_APPROVAL,
        },
      });

      const report = await tx.failureReport.create({
        data: {
          taskId: task.id,
          equipmentName: dto.equipmentName,
          description: dto.description,
          priority: dto.priority ?? MaintenancePriority.NORMAL,
          productionOrderId: dto.productionOrderId ?? null,
          reportedById: userId,
        },
      });

      if (dto.productionOrderId) {
        const order = await tx.productionOrder.findUnique({
          where: { id: dto.productionOrderId },
        });

        if (order && order.status !== 'CANCELLED') {
          await tx.productionOrder.update({
            where: { id: dto.productionOrderId },
            data: { status: 'CANCELLED' },
          });
        }
      }

      const managers = await tx.user.findMany({
        where: {
          roles: {
            some: {
              name: { in: ['MAINTENANCE_MANAGER', 'ADMIN'] as any },
            },
          },
        },
        select: { id: true },
      });

      await this.notificationsService.createForUsers(
        managers.map((m) => m.id),
        {
          title: `Equipment failure: ${dto.equipmentName}`,
          message: dto.description,
          type: 'FAILURE_REPORT',
          urgent: dto.priority === MaintenancePriority.CRITICAL,
        },
      );

      return {
        task,
        report,
        message: 'Failure reported. Maintenance team notified.',
      };
    });
  }

  async getTasks(query: GetTasksQueryDto) {
    const {
      status,
      type,
      priority,
      assignedToId,
      page = 1,
      limit = 20,
    } = query;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const where = {
      ...(status && { status }),
      ...(type && { type }),
      ...(priority && { priority }),
      ...(assignedToId && { assignedToId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.maintenanceTask.findMany({
        where,
        include: {
          assignedTo: {
            include: { user: { select: { username: true, email: true } } },
          },
          reportedBy: { select: { username: true, email: true } },
          spareParts: {
            include: { item: { select: { name: true, unit: true } } },
          },
          failureReport: true,
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      this.prisma.maintenanceTask.count({ where }),
    ]);

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  async getMyTasks(userId: string) {
    const worker = await this.prisma.workerProfile.findUnique({
      where: { userId },
    });

    if (!worker) {
      throw new NotFoundException('No worker profile for this user');
    }

    const endToday = this.endOfToday();

    return this.prisma.maintenanceTask.findMany({
      where: {
        assignedToId: worker.id,
        status: {
          in: [
            MaintenanceStatus.OPEN,
            MaintenanceStatus.IN_PROGRESS,
            MaintenanceStatus.PENDING_COMPLETION,
          ],
        },
        NOT: {
          type: MaintenanceType.PREVENTIVE,
          status: MaintenanceStatus.OPEN,
          scheduledDate: { gt: endToday },
        },
      },
      include: {
        spareParts: { include: { item: { select: { name: true, unit: true } } } },
        failureReport: true,
        reportedBy: { select: { username: true } },
      },
      orderBy: [{ priority: 'desc' }, { scheduledDate: 'asc' }],
    });
  }

  async getMyTaskHistory(userId: string) {
    const worker = await this.prisma.workerProfile.findUnique({
      where: { userId },
    });

    if (!worker) {
      throw new NotFoundException('No worker profile for this user');
    }

    return this.prisma.maintenanceTask.findMany({
      where: {
        assignedToId: worker.id,
        status: MaintenanceStatus.COMPLETED,
      },
      include: {
        spareParts: { include: { item: { select: { name: true, unit: true } } } },
        failureReport: true,
        reportedBy: { select: { username: true } },
      },
      orderBy: { completedAt: 'desc' },
    });
  }

  async listFailureReports(
    userId: string,
    roles: string[],
    query: {
      status?: MaintenanceStatus;
      priority?: MaintenancePriority;
    },
  ) {
    const broadAccess = roles.some((r) =>
      ['ADMIN', 'MAINTENANCE_MANAGER', 'PRODUCTION_MANAGER'].includes(r),
    );

    const where: Prisma.MaintenanceTaskWhereInput = {
      failureReport: { isNot: null },
      ...(query.status && { status: query.status }),
      ...(query.priority && { priority: query.priority }),
      ...(!broadAccess && { reportedById: userId }),
    };

    const data = await this.prisma.maintenanceTask.findMany({
      where,
      include: {
        failureReport: true,
        reportedBy: { select: { username: true, email: true } },
        assignedTo: {
          include: { user: { select: { username: true, email: true } } },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    const summary = await this.prisma.maintenanceTask.groupBy({
      by: ['status'],
      where: {
        failureReport: { isNot: null },
        ...(!broadAccess && { reportedById: userId }),
      },
      _count: { id: true },
    });

    return {
      data,
      total: data.length,
      summary: summary.map((row) => ({
        status: row.status,
        count: row._count.id,
      })),
    };
  }

  async getPendingFailures() {
    return this.prisma.maintenanceTask.findMany({
      where: {
        status: MaintenanceStatus.PENDING_APPROVAL,
        failureReport: { isNot: null },
      },
      include: {
        failureReport: true,
        reportedBy: { select: { username: true, email: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getPendingCompletions() {
    return this.prisma.maintenanceTask.findMany({
      where: { status: MaintenanceStatus.PENDING_COMPLETION },
      include: {
        assignedTo: { include: { user: { select: { username: true } } } },
        spareParts: { include: { item: { select: { name: true, unit: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getMaintenanceRequisitions() {
    return (this.prisma as any).inventoryRequisition.findMany({
      where: {
        referenceId: { not: null },
        status: 'PENDING',
      },
      include: {
        item: true,
        requestedBy: { select: { id: true, username: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTask(taskId: string) {
    try {
      return await this.prisma.maintenanceTask.findUniqueOrThrow({
        where: { id: taskId },
        include: {
          assignedTo: { include: { user: true } },
          reportedBy: true,
          spareParts: { include: { item: true } },
          failureReport: true,
        },
      });
    } catch {
      throw new NotFoundException('Task not found');
    }
  }

  async getTechnicians() {
    const users = await this.prisma.user.findMany({
      where: {
        roles: {
          some: { name: 'MAINTENANCE_TECHNICIAN' as any },
        },
      },
      include: {
        workerProfile: {
          select: {
            id: true,
            position: true,
            userId: true,
          },
        },
      },
    });

    return users
      .filter((u) => u.workerProfile)
      .map((u) => ({
        id: u.workerProfile!.id,
        userId: u.id,
        username: u.username,
        email: u.email,
        position: u.workerProfile!.position ?? 'Technician',
      }));
  }

  async cancelTask(taskId: string) {
    const task = await this.getMaintenanceTaskOrThrow(taskId);

    if (task.status === MaintenanceStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed task');
    }

    return this.prisma.maintenanceTask.update({
      where: { id: taskId },
      data: { status: MaintenanceStatus.CANCELLED },
    });
  }

  async getAnalytics() {
    // Base aggregates
    const [total, byStatus, byType, byPriority, completion] = await Promise.all(
      [
        this.prisma.maintenanceTask.count(),
        this.prisma.maintenanceTask.groupBy({
          by: ['status'],
          _count: { id: true },
        }),
        this.prisma.maintenanceTask.groupBy({
          by: ['type'],
          _count: { id: true },
        }),
        this.prisma.maintenanceTask.groupBy({
          by: ['priority'],
          _count: { id: true },
        }),
        this.prisma.maintenanceTask.aggregate({
          where: { status: MaintenanceStatus.COMPLETED },
          _avg: { timeSpentMins: true },
          _count: { id: true },
        }),
      ],
    );

    // Per-technician completed counts and average time spent
    const perTechGroups = await this.prisma.maintenanceTask.groupBy({
      by: ['assignedToId'],
      where: {
        status: MaintenanceStatus.COMPLETED,
        NOT: { assignedToId: null },
      },
      _count: { id: true },
      _avg: { timeSpentMins: true },
    });

    const techIds = perTechGroups
      .map((g) => g.assignedToId)
      .filter(Boolean) as string[];
    const techProfiles = techIds.length
      ? await this.prisma.workerProfile.findMany({
          where: { id: { in: techIds } },
          include: { user: { select: { username: true } } },
        })
      : [];

    const perTechnician = perTechGroups.map((g) => ({
      technicianId: g.assignedToId,
      completedCount: g._count.id,
      avgTimeSpentMins: g._avg.timeSpentMins ?? 0,
      username:
        techProfiles.find((t) => t.id === g.assignedToId)?.user.username ??
        null,
    }));

    // Top spare parts consumed in maintenance (sum quantityUsed)
    const spareGroups = await this.prisma.maintenanceSparePart.groupBy({
      by: ['itemId'],
      _sum: { quantityUsed: true },
      orderBy: { _sum: { quantityUsed: 'desc' } },
      take: 10,
    });

    const spareIds = spareGroups.map((s) => s.itemId);
    const spareItems = spareIds.length
      ? await this.prisma.inventoryItem.findMany({
          where: { id: { in: spareIds } },
        })
      : [];

    const topSpareParts = spareGroups.map((s) => ({
      itemId: s.itemId,
      name: spareItems.find((it) => it.id === s.itemId)?.name ?? 'Unknown',
      totalUsed: this.toNumber(s._sum.quantityUsed ?? 0),
    }));

    // Top failing equipment (failure reports count)
    const equipmentFailures = await this.prisma.failureReport.groupBy({
      by: ['equipmentName'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const topEquipmentFailures = equipmentFailures.map((e) => ({
      equipmentName: e.equipmentName,
      count: e._count.id,
    }));

    // Overdue/open tasks (scheduledDate past today and not completed)
    const overdueCount = await this.prisma.maintenanceTask.count({
      where: {
        status: { not: MaintenanceStatus.COMPLETED },
        scheduledDate: { lte: new Date() },
      },
    });

    // Average days to complete (created -> completed) via raw SQL for accuracy
    const avgDaysResult = await this.prisma.$queryRawUnsafe<
      Array<{ avgDays: number | null }>
    >(
      `SELECT AVG(DATEDIFF(completedAt, createdAt)) AS avgDays FROM maintenance_tasks WHERE completedAt IS NOT NULL`,
    );

    const avgDaysToComplete = avgDaysResult?.[0]?.avgDays ?? 0;

    const mapGroupCount = <T extends string>(
      rows: Array<Record<string, unknown>>,
      field: string,
    ) =>
      rows.map((row) => ({
        [field]: row[field] as T,
        count: this.toNumber((row._count as { id?: number })?.id ?? 0),
      }));

    return {
      total,
      byStatus: mapGroupCount(byStatus, 'status'),
      byType: mapGroupCount(byType, 'type'),
      byPriority: mapGroupCount(byPriority, 'priority'),
      avgCompletionMins: completion._avg.timeSpentMins ?? 0,
      totalCompleted: completion._count.id,
      perTechnician,
      topSpareParts,
      topEquipmentFailures,
      overdueCount,
      avgDaysToComplete: this.toNumber(avgDaysToComplete),
    };
  }

  private toNumber(v: any): number {
    if (v === null || v === undefined) return 0;
    if (typeof v === 'number') return v;
    if (typeof v === 'bigint') return Number(v);
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
  }

  /**
   * Advanced maintenance reports: MTTR, MTBF, total downtime, spare part cost
   * Optionally scope to the last `days` days (default: 90)
   */
  async getAdvancedReports(days = 90) {
    const now = new Date();
    const currentSince = new Date(now);
    currentSince.setDate(now.getDate() - days);
    const priorSince = new Date(now);
    priorSince.setDate(now.getDate() - 2 * days);
    const priorUntil = new Date(now);
    priorUntil.setDate(now.getDate() - days);

    const computeWindow = async (start: Date, end?: Date) => {
      // MTTR
      const completedWhere: any = {
        status: MaintenanceStatus.COMPLETED,
      };
      if (start && end) {
        completedWhere.completedAt = { gte: start, lt: end };
      } else if (start) {
        completedWhere.completedAt = { gte: start };
      }

      const completedTasks = await this.prisma.maintenanceTask.findMany({
        where: completedWhere,
        select: { timeSpentMins: true, createdAt: true, completedAt: true },
      });

      const mttrValues: number[] = completedTasks
        .map((t) => {
          if (t.timeSpentMins && t.timeSpentMins > 0)
            return this.toNumber(t.timeSpentMins);
          if (t.completedAt && t.createdAt)
            return Math.max(
              0,
              Math.round(
                (t.completedAt.getTime() - t.createdAt.getTime()) / 60000,
              ),
            );
          return 0;
        })
        .filter((v) => v > 0);

      const mttrMinutes =
        mttrValues.length > 0
          ? mttrValues.reduce((a, b) => a + b, 0) / mttrValues.length
          : 0;

      // MTBF + downtime (every failure report has a required taskId)
      const failuresWhere: Prisma.FailureReportWhereInput = {};
      if (start && end) {
        failuresWhere.createdAt = { gte: start, lt: end };
      } else if (start) {
        failuresWhere.createdAt = { gte: start };
      }

      const failures = await this.prisma.failureReport.findMany({
        where: failuresWhere,
        orderBy: { createdAt: 'asc' },
        select: { id: true, taskId: true, createdAt: true },
      });

      let mtbfDays = 0;
      if (failures.length > 1) {
        const diffs: number[] = [];
        for (let i = 1; i < failures.length; i++) {
          const prev = failures[i - 1].createdAt.getTime();
          const cur = failures[i].createdAt.getTime();
          diffs.push((cur - prev) / (1000 * 60 * 60 * 24));
        }
        mtbfDays = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      }

      let totalDowntimeMinutes = 0;
      if (failures.length > 0) {
        const taskIds = failures.map((f) => f.taskId);
        const tasks = await this.prisma.maintenanceTask.findMany({
          where: { id: { in: taskIds } },
          select: { id: true, completedAt: true },
        });
        const taskMap = new Map(tasks.map((t) => [t.id, t.completedAt]));
        for (const f of failures) {
          const completedAt = taskMap.get(f.taskId);
          if (completedAt) {
            const diff = Math.max(
              0,
              Math.round(
                (completedAt.getTime() - f.createdAt.getTime()) / (1000 * 60),
              ),
            );
            totalDowntimeMinutes += diff;
          }
        }
      }

      // Spare part cost in window: only count spare usage where the parent maintenanceSparePart was created within window
      const spareUsage = await this.prisma.maintenanceSparePart.groupBy({
        by: ['itemId'],
        where: {
          createdAt:
            start && end
              ? { gte: start, lt: end }
              : start
                ? { gte: start }
                : undefined,
        },
        _sum: { quantityUsed: true },
      });

      const itemIds = spareUsage.map((s) => s.itemId);
      let totalSpareCost = 0;
      if (itemIds.length > 0) {
        const receiptItems = await this.prisma.inventoryReceiptItem.findMany({
          where: { itemId: { in: itemIds } },
          select: { itemId: true, quantity: true, unitPrice: true },
        });
        const priceMap = new Map<
          string,
          { totalQty: number; totalValue: number }
        >();
        for (const ri of receiptItems) {
          const prev = priceMap.get(ri.itemId) ?? {
            totalQty: 0,
            totalValue: 0,
          };
          prev.totalQty += this.toNumber(ri.quantity);
          prev.totalValue +=
            this.toNumber(ri.unitPrice ?? 0) * this.toNumber(ri.quantity);
          priceMap.set(ri.itemId, prev);
        }

        for (const s of spareUsage) {
          const stats = priceMap.get(s.itemId);
          const avgPrice =
            stats && stats.totalQty > 0 ? stats.totalValue / stats.totalQty : 0;
          totalSpareCost += this.toNumber(s._sum.quantityUsed ?? 0) * avgPrice;
        }
      }

      return {
        mttrMinutes,
        mtbfDays,
        totalDowntimeMinutes,
        totalSpareCost,
      };
    };

    const current = await computeWindow(currentSince);
    const prior = await computeWindow(priorSince, priorUntil);

    return {
      current,
      prior,
      periodDays: days,
    };
  }
}
