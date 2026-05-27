import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MaintenancePriority, MaintenanceStatus, MaintenanceType, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { ReportFailureDto } from './dto/report-failure.dto';
import { GetTasksQueryDto } from './dto/get-tasks-query.dto';

@Injectable()
export class MaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

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
        status: dto.assignedToId ? MaintenanceStatus.IN_PROGRESS : MaintenanceStatus.OPEN,
      },
      include: {
        assignedTo: { include: { user: { select: { username: true, email: true } } } },
        reportedBy: { select: { username: true, email: true } },
      },
    });
  }

  async assignTask(taskId: string, dto: AssignTaskDto) {
    const task = await this.prisma.maintenanceTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.status === MaintenanceStatus.COMPLETED) {
      throw new BadRequestException('Cannot reassign completed task');
    }

    const technician = await this.prisma.workerProfile.findUnique({
      where: { id: dto.assignedToId },
    });

    if (!technician) {
      throw new NotFoundException('Technician not found');
    }

    return this.prisma.maintenanceTask.update({
      where: { id: taskId },
      data: { assignedToId: dto.assignedToId, status: MaintenanceStatus.IN_PROGRESS },
      include: { assignedTo: { include: { user: { select: { username: true } } } } },
    });
  }

  async completeTask(taskId: string, dto: CompleteTaskDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      let task;
      try {
        task = await tx.maintenanceTask.findUniqueOrThrow({
          where: { id: taskId },
          include: { assignedTo: true },
        });
      } catch {
        throw new NotFoundException('Task not found');
      }

      if (task.status === MaintenanceStatus.COMPLETED) {
        throw new BadRequestException('Task already completed');
      }

      if (dto.spareParts && dto.spareParts.length > 0) {
        for (const sparePart of dto.spareParts) {
          const item = await tx.inventoryItem.findUniqueOrThrow({
            where: { id: sparePart.itemId },
          });

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
              performedById: userId,
              referenceId: taskId,
              note: `Spare part used in maintenance: ${task.equipmentName}`,
            },
          });

          await tx.maintenanceSparePart.create({
            data: { taskId, itemId: sparePart.itemId, quantityUsed: sparePart.quantityUsed },
          });
        }
      }

      return tx.maintenanceTask.update({
        where: { id: taskId },
        data: {
          status: MaintenanceStatus.COMPLETED,
          completedAt: new Date(),
          timeSpentMins: dto.timeSpentMins,
          notes: dto.notes,
        },
        include: {
          spareParts: { include: { item: { select: { name: true, unit: true } } } },
          assignedTo: { include: { user: { select: { username: true } } } },
        },
      });
    });
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
          status: MaintenanceStatus.OPEN,
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

      return { task, report, message: 'Failure reported. Maintenance team notified.' };
    });
  }

  async getTasks(query: GetTasksQueryDto) {
    const { status, type, priority, assignedToId, page = 1, limit = 20 } = query;
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
          assignedTo: { include: { user: { select: { username: true, email: true } } } },
          reportedBy: { select: { username: true, email: true } },
          spareParts: { include: { item: { select: { name: true, unit: true } } } },
          failureReport: true,
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.maintenanceTask.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getMyTasks(userId: string) {
    const worker = await this.prisma.workerProfile.findUnique({
      where: { userId },
    });

    if (!worker) {
      throw new NotFoundException('No worker profile for this user');
    }

    return this.prisma.maintenanceTask.findMany({
      where: { assignedToId: worker.id, status: { not: MaintenanceStatus.COMPLETED } },
      include: { spareParts: true, failureReport: true, reportedBy: { select: { username: true } } },
      orderBy: [{ priority: 'desc' }, { scheduledDate: 'asc' }],
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

  async getAnalytics() {
    const [total, byStatus, byType, byPriority, completion] = await Promise.all([
      this.prisma.maintenanceTask.count(),
      this.prisma.maintenanceTask.groupBy({ by: ['status'], _count: { id: true } }),
      this.prisma.maintenanceTask.groupBy({ by: ['type'], _count: { id: true } }),
      this.prisma.maintenanceTask.groupBy({ by: ['priority'], _count: { id: true } }),
      this.prisma.maintenanceTask.aggregate({
        where: { status: MaintenanceStatus.COMPLETED },
        _avg: { timeSpentMins: true },
        _count: { id: true },
      }),
    ]);

    return {
      total,
      byStatus,
      byType,
      byPriority,
      avgCompletionMins: completion._avg.timeSpentMins ?? 0,
      totalCompleted: completion._count.id,
    };
  }
}
