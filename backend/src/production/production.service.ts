import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ProductionIssuePriority,
  ProductionIssueStatus,
  ProductionIssueType,
  ProductionOrderStatus,
  ProductionStageName,
  ProductionStageStatus,
  TransactionType,
  ReferenceType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateProductionOrderDto } from './dto/create-production-order.dto';
import { UpdateProductionOrderDto } from './dto/update-production-order.dto';
import { RecordOutputDto } from './dto/record-output.dto';
import { ReportIssueDto } from './dto/report-issue.dto';

type CurrentUserPayload = {
  userId: string;
  roles: string[];
};

const STAGE_ORDER: ProductionStageName[] = [
  ProductionStageName.CUTTING,
  ProductionStageName.SEWING,
  ProductionStageName.FINISHING,
  ProductionStageName.PACKING,
];

function toTitleCaseStatus(
  status: ProductionOrderStatus | ProductionStageStatus,
) {
  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

@Injectable()
export class ProductionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private get client() {
    return this.prisma as any;
  }

  private async notifyInventoryShortage(message: string) {
    const recipients = await this.client.user.findMany({
      where: {
        roles: {
          some: {
            name: { in: ['STOREKEEPER', 'ADMIN'] },
          },
        },
      },
      select: { id: true },
    });

    await this.notificationsService.createForUsers(
      recipients.map((recipient: { id: string }) => recipient.id),
      {
        title: 'Production material shortage',
        message,
        type: 'MATERIAL_SHORTAGE',
        urgent: true,
      },
    );
  }

  private async notifyQaManagers(message: string, urgent = false) {
    const recipients = await this.client.user.findMany({
      where: {
        roles: {
          some: {
            name: { in: ['QA_MANAGER', 'ADMIN'] },
          },
        },
      },
      select: { id: true },
    });

    await this.notificationsService.createForUsers(
      recipients.map((recipient: { id: string }) => recipient.id),
      {
        title: urgent ? 'Order ready for final release' : 'QA review required',
        message,
        type: 'QA_REVIEW',
        urgent,
      },
    );
  }

  private ensureCanChangeStatus(
    current: ProductionOrderStatus,
    next: ProductionOrderStatus,
  ) {
    if (current === next) return;
    const allowed: Record<ProductionOrderStatus, ProductionOrderStatus[]> = {
      PLANNED: [
        ProductionOrderStatus.IN_PROGRESS,
        ProductionOrderStatus.CANCELLED,
      ],
      IN_PROGRESS: [
        ProductionOrderStatus.COMPLETED,
        ProductionOrderStatus.STOPPED,
        ProductionOrderStatus.CANCELLED,
      ],
      COMPLETED: [],
      STOPPED: [
        ProductionOrderStatus.IN_PROGRESS,
        ProductionOrderStatus.CANCELLED,
      ],
      CANCELLED: [],
    };

    if (!allowed[current].includes(next)) {
      throw new BadRequestException(
        `Invalid production order transition from ${toTitleCaseStatus(current)} to ${toTitleCaseStatus(next)}`,
      );
    }
  }

  private async getOrderOrThrow(orderId: string) {
    const order = await this.prisma.productionOrder.findUnique({
      where: { id: orderId },
      include: {
        bomItems: { include: { material: true } },
        stages: {
          orderBy: { stageOrder: 'asc' },
          include: {
            assignedWorker: {
              include: { user: { select: { username: true } } },
            },
            reviewedBy: { select: { id: true, username: true } },
            completedBy: { select: { id: true, username: true } },
            qualityInspections: true,
            outputs: true,
            issues: true,
          },
        },
        outputs: true,
        assignedSupervisor: {
          select: { id: true, username: true, email: true },
        },
        createdByManager: { select: { id: true, username: true, email: true } },
        releaseRequestedBy: { select: { id: true, username: true, email: true } },
        releaseApprovedBy: { select: { id: true, username: true, email: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Production order not found');
    }

    return order;
  }

  private async getStageOrThrow(orderId: string, stageId: string) {
    const stage = await this.prisma.productionStage.findUnique({
      where: { id: stageId },
      include: {
        productionOrder: true,
        qualityInspections: true,
      },
    });

    if (!stage || stage.productionOrderId !== orderId) {
      throw new NotFoundException(
        'Stage does not belong to this production order',
      );
    }

    return stage;
  }

  private async getApprovedInspection(stageId: string) {
    return this.prisma.qualityInspection.findFirst({
      where: {
        stageId,
        status: 'APPROVED',
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createOrder(body: CreateProductionOrderDto, managerId: string) {
    const orderNumber =
      body.productCode && body.productCode.trim()
        ? body.productCode.trim()
        : `PO-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    return this.prisma.$transaction(async (tx) => {
      const client = tx as any;
      const bomItems = body.bomItems ?? [];

      const materials = bomItems.length
        ? await client.inventoryItem.findMany({
            where: { id: { in: bomItems.map((item) => item.materialId) } },
          })
        : [];

      const missingMaterials = bomItems
        .map((item) => {
          const material = materials.find((m: any) => m.id === item.materialId);
          return {
            materialId: item.materialId,
            name: material?.name ?? 'Unknown material',
            requiredQuantity: item.requiredQuantity,
            availableQuantity: material?.quantity ?? 0,
            unit: item.unit ?? material?.unit ?? '',
          };
        })
        .filter((item) => item.availableQuantity < item.requiredQuantity);

      if (missingMaterials.length > 0) {
        await this.notifyInventoryShortage(
          `Production order ${orderNumber} could not be created because these materials are short: ${missingMaterials
            .map(
              (item) =>
                `${item.name} (${item.availableQuantity}/${item.requiredQuantity} ${item.unit})`,
            )
            .join(', ')}`,
        );
        throw new BadRequestException(
          `Insufficient materials: ${missingMaterials
            .map(
              (item) =>
                `${item.name} (${item.availableQuantity}/${item.requiredQuantity} ${item.unit})`,
            )
            .join(', ')}`,
        );
      }

      const created = await client.productionOrder.create({
        data: {
          orderNumber,
          productName: body.productName,
          productCode: body.productCode,
          targetQuantity: body.targetQuantity,
          deadline: new Date(body.deadline),
          status: ProductionOrderStatus.PLANNED,
          assignedSupervisorId: body.assignedSupervisorId,
          createdByManagerId: managerId,
          bomItems: bomItems.length
            ? {
                create: bomItems.map((item) => ({
                  materialId: item.materialId,
                  requiredQuantity: item.requiredQuantity,
                  unit: item.unit,
                })),
              }
            : undefined,
          stages: {
            create: STAGE_ORDER.map((stageName, index) => ({
              stageName,
              stageOrder: index + 1,
            })),
          },
        },
        include: {
          bomItems: { include: { material: true } },
          stages: true,
          assignedSupervisor: {
            select: { id: true, username: true, email: true },
          },
          createdByManager: {
            select: { id: true, username: true, email: true },
          },
        },
      });

      for (const bomItem of bomItems) {
        await client.inventoryItem.update({
          where: { id: bomItem.materialId },
          data: { quantity: { decrement: bomItem.requiredQuantity } },
        });
        await client.inventoryTransaction.create({
          data: {
            itemId: bomItem.materialId,
            type: TransactionType.ISSUE,
            quantity: bomItem.requiredQuantity,
            performedById: managerId,
            referenceId: created.id,
            referenceType: ReferenceType.PRODUCTION_ORDER,
            note: `Reserved for production order ${created.orderNumber}`,
          },
        });
      }

      return created;
    });
  }

  async listOrders(user: CurrentUserPayload) {
    const roles = user.roles ?? [];
    const isSupervisor = roles.includes('PRODUCTION_SUPERVISOR');
    const baseWhere: Prisma.ProductionOrderWhereInput = isSupervisor
      ? { assignedSupervisorId: user.userId }
      : {};

    const include = {
      bomItems: { include: { material: true } },
      stages: {
        orderBy: { stageOrder: 'asc' as const },
        include: {
          assignedWorker: {
            include: { user: { select: { username: true } } },
          },
          reviewedBy: { select: { id: true, username: true } },
          completedBy: { select: { id: true, username: true } },
          qualityInspections: true,
        },
      },
      assignedSupervisor: {
        select: { id: true, username: true, email: true },
      },
    };

    // Active orders at the top (newest first), completed orders at the
    // bottom (oldest completion first), so the most recently finished work
    // appears immediately above the older completed history.
    const [active, completed] = await this.prisma.$transaction([
      this.prisma.productionOrder.findMany({
        where: { ...baseWhere, status: { not: 'COMPLETED' } },
        include,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.productionOrder.findMany({
        where: { ...baseWhere, status: 'COMPLETED' },
        include,
        orderBy: { updatedAt: 'asc' },
      }),
    ]);

    return [...active, ...completed];
  }

  async getOrderById(id: string) {
    return this.getOrderOrThrow(id);
  }

  async updateOrder(id: string, body: UpdateProductionOrderDto) {
    const order = await this.getOrderOrThrow(id);
    if (body.status) {
      this.ensureCanChangeStatus(order.status, body.status);
    }

    return this.prisma.productionOrder.update({
      where: { id },
      data: {
        productName: body.productName,
        productCode: body.productCode,
        targetQuantity: body.targetQuantity,
        deadline: body.deadline ? new Date(body.deadline) : undefined,
        assignedSupervisorId: body.assignedSupervisorId,
        status: body.status,
      },
    });
  }

  async cancelOrder(id: string) {
    await this.getOrderOrThrow(id);
    return this.prisma.productionOrder.update({
      where: { id },
      data: { status: ProductionOrderStatus.CANCELLED, currentStage: null },
    });
  }

  async assignSupervisor(id: string, supervisorId: string) {
    await this.getOrderOrThrow(id);
    return this.prisma.productionOrder.update({
      where: { id },
      data: { assignedSupervisorId: supervisorId },
    });
  }

  async checkMaterial(orderId: string) {
    const order = await this.getOrderOrThrow(orderId);
    const missing = order.bomItems.filter(
      (item) =>
        !item.material || item.material.quantity < item.requiredQuantity,
    );

    return {
      orderId,
      orderNumber: order.orderNumber,
      available: missing.length === 0,
      missingMaterials: missing.map((item) => ({
        materialId: item.materialId,
        name: item.material?.name ?? 'Unknown material',
        requiredQuantity: item.requiredQuantity,
        availableQuantity: item.material?.quantity ?? 0,
        unit: item.unit,
      })),
    };
  }

  async approveOrder(id: string) {
    const order = await this.getOrderOrThrow(id);
    const materialCheck = await this.checkMaterial(id);
    if (!materialCheck.available) {
      throw new BadRequestException(
        `Insufficient materials: ${materialCheck.missingMaterials
          .map(
            (item) =>
              `${item.name} (${item.availableQuantity}/${item.requiredQuantity} ${item.unit})`,
          )
          .join(', ')}`,
      );
    }

    if (order.status !== ProductionOrderStatus.PLANNED) {
      throw new BadRequestException('Only Planned orders can be approved');
    }

    return this.prisma.productionOrder.update({
      where: { id },
      data: { status: ProductionOrderStatus.IN_PROGRESS },
    });
  }

  async startStage(orderId: string, stageId: string) {
    const stage = await this.getStageOrThrow(orderId, stageId);
    const order = stage.productionOrder;
    if (order.status === ProductionOrderStatus.PLANNED) {
      await this.prisma.productionOrder.update({
        where: { id: orderId },
        data: { status: ProductionOrderStatus.IN_PROGRESS },
      });
    }

    const previousStages = await this.prisma.productionStage.findMany({
      where: {
        productionOrderId: orderId,
        stageOrder: { lt: stage.stageOrder },
      },
      orderBy: { stageOrder: 'asc' },
    });

    if (
      previousStages.some(
        (prev) => prev.status !== ProductionStageStatus.QA_APPROVED,
      )
    ) {
      throw new BadRequestException(
        'Previous stage must be QA approved before starting this stage',
      );
    }

    return this.prisma.productionStage.update({
      where: { id: stageId },
      data: {
        status: ProductionStageStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
    });
  }

  async stopStage(orderId: string, stageId: string) {
    await this.getStageOrThrow(orderId, stageId);
    return this.prisma.productionStage.update({
      where: { id: stageId },
      data: { status: ProductionStageStatus.PENDING },
    });
  }

  async resumeStage(orderId: string, stageId: string) {
    const stage = await this.getStageOrThrow(orderId, stageId);
    if (stage.status !== ProductionStageStatus.PENDING) {
      throw new BadRequestException('Only stopped stages can be resumed');
    }

    const previousStages = await this.prisma.productionStage.findMany({
      where: {
        productionOrderId: orderId,
        stageOrder: { lt: stage.stageOrder },
      },
      orderBy: { stageOrder: 'asc' },
    });
    if (
      previousStages.some(
        (prev) => prev.status !== ProductionStageStatus.QA_APPROVED,
      )
    ) {
      throw new BadRequestException(
        'Previous stage must be QA approved before resuming this stage',
      );
    }

    return this.prisma.productionStage.update({
      where: { id: stageId },
      data: { status: ProductionStageStatus.IN_PROGRESS },
    });
  }

  async submitForQa(orderId: string, stageId: string, userId: string) {
    const stage = await this.getStageOrThrow(orderId, stageId);
    if (stage.status !== ProductionStageStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Stage must be IN_PROGRESS before it can be submitted for QA',
      );
    }
    return this.prisma.productionStage.update({
      where: { id: stageId },
      data: {
        status: ProductionStageStatus.QA_PENDING,
        completedById: userId,
        completedAt: new Date(),
      },
    });
  }

  async completeStage(orderId: string, stageId: string, userId: string) {
    const stage = await this.getStageOrThrow(orderId, stageId);
    const approvedInspection = await this.getApprovedInspection(stageId);
    if (!approvedInspection) {
      throw new ForbiddenException(
        'QA approval is required before completing this stage',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedStage = await tx.productionStage.update({
        where: { id: stageId },
        data: {
          status: ProductionStageStatus.QA_APPROVED,
          completedById: userId,
          completedAt: new Date(),
          reviewedById: approvedInspection.inspectedById,
          reviewedAt: approvedInspection.updatedAt,
        },
      });

      const remaining = await tx.productionStage.count({
        where: {
          productionOrderId: orderId,
          stageOrder: { gt: stage.stageOrder },
          status: { not: ProductionStageStatus.QA_APPROVED },
        },
      });

      if (remaining === 0) {
        await tx.productionOrder.update({
          where: { id: orderId },
          data: {
            currentStage: updatedStage.stageName,
            status: ProductionOrderStatus.IN_PROGRESS,
          },
        });
      } else {
        await tx.productionOrder.update({
          where: { id: orderId },
          data: {
            currentStage: updatedStage.stageName,
            status: ProductionOrderStatus.IN_PROGRESS,
          },
        });
      }

      return updatedStage;
    });
  }

  async qaReview(
    orderId: string,
    stageId: string,
    action: 'APPROVE' | 'REJECT',
    userId: string,
  ) {
    const stage = await this.getStageOrThrow(orderId, stageId);
    const nextStatus =
      action === 'APPROVE'
        ? ProductionStageStatus.QA_APPROVED
        : ProductionStageStatus.QA_REJECTED;

    return this.prisma.productionStage.update({
      where: { id: stage.id },
      data: {
        status: nextStatus,
        reviewedById: userId,
        reviewedAt: new Date(),
      },
    });
  }

  async recordOutput(orderId: string, body: RecordOutputDto, userId: string) {
    const stage = await this.getStageOrThrow(orderId, body.stageId);
    const order = await this.getOrderOrThrow(orderId);

    if (order.status === ProductionOrderStatus.PLANNED) {
      await this.prisma.productionOrder.update({
        where: { id: orderId },
        data: { status: ProductionOrderStatus.IN_PROGRESS },
      });
    }

    if (stage.status === ProductionStageStatus.PENDING) {
      await this.prisma.productionStage.update({
        where: { id: body.stageId },
        data: {
          status: ProductionStageStatus.IN_PROGRESS,
          startedAt: new Date(),
        },
      });
    }

    return this.prisma.productionOutput.create({
      data: {
        productionOrderId: orderId,
        stageId: body.stageId,
        supervisorId: userId,
        shiftDate: new Date(body.shiftDate),
        goodQuantity: body.goodQuantity,
        defectiveQuantity: body.defectiveQuantity ?? 0,
        notes: body.notes,
      },
    });
  }

  async getOutputHistory(orderId: string) {
    await this.getOrderOrThrow(orderId);
    return this.prisma.productionOutput.findMany({
      where: { productionOrderId: orderId },
      include: {
        stage: true,
        supervisor: { select: { username: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reportIssue(orderId: string, body: ReportIssueDto, userId: string) {
    const stageId =
      body.stageId ??
      (
        await this.prisma.productionStage.findFirstOrThrow({
          where: { productionOrderId: orderId },
          orderBy: { stageOrder: 'asc' },
          select: { id: true },
        })
      ).id;

    await this.getStageOrThrow(orderId, stageId);

    return this.prisma.productionIssue.create({
      data: {
        productionOrderId: orderId,
        stageId,
        reportedById: userId,
        issueType: body.issueType ?? ProductionIssueType.OTHER,
        description: body.description,
        priority: body.priority ?? ProductionIssuePriority.NORMAL,
        status: ProductionIssueStatus.OPEN,
      },
    });
  }

  async getIssues(orderId: string) {
    await this.getOrderOrThrow(orderId);
    return this.prisma.productionIssue.findMany({
      where: { productionOrderId: orderId },
      include: {
        stage: true,
        reportedBy: { select: { username: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOutputReport(params: {
    from?: string;
    to?: string;
    orderId?: string;
  }) {
    const outputs = await this.prisma.productionOutput.findMany({
      where: {
        productionOrderId: params.orderId,
        shiftDate: {
          gte: params.from ? new Date(params.from) : undefined,
          lte: params.to ? new Date(params.to) : undefined,
        },
      },
      include: {
        stage: true,
        productionOrder: true,
        supervisor: { select: { username: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalGood = outputs.reduce(
      (sum, output) => sum + output.goodQuantity,
      0,
    );
    const totalDefective = outputs.reduce(
      (sum, output) => sum + output.defectiveQuantity,
      0,
    );
    const byShift = outputs.reduce<
      Record<string, { good: number; defective: number }>
    >((acc, output) => {
      const key = output.shiftDate.toISOString().slice(0, 10);
      acc[key] ??= { good: 0, defective: 0 };
      acc[key].good += output.goodQuantity;
      acc[key].defective += output.defectiveQuantity;
      return acc;
    }, {});

    const byStage = outputs.reduce<
      Record<string, { good: number; defective: number }>
    >((acc, output) => {
      const key = output.stage?.stageName ?? 'UNKNOWN';
      acc[key] ??= { good: 0, defective: 0 };
      acc[key].good += output.goodQuantity;
      acc[key].defective += output.defectiveQuantity;
      return acc;
    }, {});

    return {
      totalRecords: outputs.length,
      totalGood,
      totalDefective,
      defectRate:
        totalGood + totalDefective > 0
          ? totalDefective / (totalGood + totalDefective)
          : 0,
      byShift,
      byStage,
      records: outputs,
    };
  }

  async getIssueReport(params: {
    from?: string;
    to?: string;
    orderId?: string;
  }) {
    const issues = await this.prisma.productionIssue.findMany({
      where: {
        productionOrderId: params.orderId,
        createdAt: {
          gte: params.from ? new Date(params.from) : undefined,
          lte: params.to ? new Date(params.to) : undefined,
        },
      },
      include: {
        stage: true,
        productionOrder: true,
        reportedBy: { select: { username: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const byType = issues.reduce<Record<string, number>>((acc, issue) => {
      acc[issue.issueType] = (acc[issue.issueType] ?? 0) + 1;
      return acc;
    }, {});

    const byPriority = issues.reduce<Record<string, number>>((acc, issue) => {
      acc[issue.priority] = (acc[issue.priority] ?? 0) + 1;
      return acc;
    }, {});

    const byStatus = issues.reduce<Record<string, number>>((acc, issue) => {
      acc[issue.status] = (acc[issue.status] ?? 0) + 1;
      return acc;
    }, {});

    return {
      totalIssues: issues.length,
      byType,
      byPriority,
      byStatus,
      openIssues: issues.filter(
        (issue) => issue.status === ProductionIssueStatus.OPEN,
      ).length,
      records: issues,
    };
  }

  async getStageOutputReport(stageId: string) {
    const outputs = await this.prisma.productionOutput.findMany({
      where: { stageId },
      include: {
        supervisor: { select: { username: true, email: true } },
        stage: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      stageId,
      totalRecords: outputs.length,
      totalGood: outputs.reduce((sum, output) => sum + output.goodQuantity, 0),
      totalDefective: outputs.reduce(
        (sum, output) => sum + output.defectiveQuantity,
        0,
      ),
      records: outputs,
    };
  }

  async recordInspection(
    orderId: string,
    stageId: string,
    userId: string,
    body: {
      measurements?: string;
      defects?: number;
      result?: string;
      notes?: string;
      status?: string;
    },
  ) {
    const { stage, threshold } = await this.getThresholdForStage(
      orderId,
      stageId,
    );
    return this.prisma.$transaction(async (tx) => {
      const defects = body.defects ?? 0;
      const totalMeasured = Math.max(1, defects + 100);
      const defectRate = (defects / totalMeasured) * 100;
      const overThreshold = Boolean(
        threshold && defectRate > threshold.maxDefectsPerHundred,
      );

      // Supersede any earlier PENDING inspections for the same stage so the
      // Approve / Reject list shows only the latest entry. This preserves the
      // audit trail (older rows are kept with status SUPERSEDED) while keeping
      // the dashboard clean.
      await tx.qualityInspection.updateMany({
        where: {
          productionOrderId: orderId,
          stageId,
          status: 'PENDING',
        },
        data: { status: 'SUPERSEDED' },
      });

      const inspection = await tx.qualityInspection.create({
        data: {
          productionOrderId: orderId,
          stageId,
          inspectedById: userId,
          measurements: body.measurements,
          defects,
          result: body.result ?? 'PENDING',
          notes: body.notes,
          status: 'PENDING',
        },
      });

      const order = await tx.productionOrder.findUnique({
        where: { id: orderId },
        select: { orderNumber: true, productName: true },
      });
      await this.notifyQaManagers(
        overThreshold
          ? `Order ${order?.orderNumber ?? orderId} stage ${stage.stageName} inspection recorded. Defects (${defects}/${totalMeasured}) exceed the configured threshold — staff must decide to approve or reject.`
          : `Order ${order?.orderNumber ?? orderId} stage ${stage.stageName} inspection recorded and is waiting for QA staff approval.`,
      );

      await this.createAuditLog({
        action: overThreshold
          ? 'INSPECTION_RECORDED_ABOVE_THRESHOLD'
          : 'INSPECTION_RECORDED',
        entityType: 'QualityInspection',
        entityId: inspection.id,
        performedById: userId,
        details: JSON.stringify({
          defects,
          measurements: body.measurements,
          notes: body.notes,
          orderId,
          stageId,
        }),
      });

      return inspection;
    });
  }

  async approveInspection(
    orderId: string,
    stageId: string,
    inspectionId: string,
  ) {
    const order = await this.getOrderOrThrow(orderId);
    const inspection = await this.prisma.qualityInspection.findUnique({
      where: { id: inspectionId },
    });
    if (!inspection || inspection.stageId !== stageId) {
      throw new NotFoundException('QA inspection not found');
    }
    if ((inspection.status ?? '').toUpperCase() === 'REJECTED') {
      throw new BadRequestException(
        'Rejected inspections require override handling before approval',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const inspectionUpdate = await tx.qualityInspection.update({
        where: { id: inspectionId },
        data: { status: 'APPROVED' },
      });

      await tx.productionStage.update({
        where: { id: stageId },
        data: {
          status: ProductionStageStatus.QA_APPROVED,
          reviewedAt: new Date(),
        },
      });

      return inspectionUpdate;
    });

    const refreshedStages = await this.prisma.productionStage.findMany({
      where: { productionOrderId: orderId },
      select: { stageOrder: true, status: true, stageName: true },
    });
    const totalStages = refreshedStages.length;
    const approvedCount = refreshedStages.filter(
      (s) => s.status === ProductionStageStatus.QA_APPROVED,
    ).length;
    const lastStage = [...refreshedStages].sort(
      (a, b) => b.stageOrder - a.stageOrder,
    )[0];

    if (
      totalStages > 0 &&
      approvedCount === totalStages &&
      lastStage?.status === ProductionStageStatus.QA_APPROVED
    ) {
      await this.notifyQaManagers(
        `Order ${order.orderNumber} (${order.productName}) has all ${totalStages} stages QA-approved and is ready for final release to finished-goods inventory.`,
        true,
      );
    }

    await this.createAuditLog({
      action: 'INSPECTION_APPROVED',
      entityType: 'QualityInspection',
      entityId: inspectionId,
      performedById: inspection.inspectedById,
      details: JSON.stringify({ orderId, stageId }),
    });

    return updated;
  }

  async rejectInspection(
    orderId: string,
    stageId: string,
    inspectionId: string,
    reason?: string,
  ) {
    await this.getStageOrThrow(orderId, stageId);
    const inspection = await this.prisma.qualityInspection.findUnique({
      where: { id: inspectionId },
    });
    if (!inspection || inspection.stageId !== stageId) {
      throw new NotFoundException('QA inspection not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.qualityInspection.update({
        where: { id: inspectionId },
        data: {
          status: 'REJECTED',
          notes: reason
            ? `${inspection.notes ?? ''}${inspection.notes ? ' | ' : ''}${reason}`
            : inspection.notes,
        },
      });

      await tx.productionStage.update({
        where: { id: stageId },
        data: {
          status: ProductionStageStatus.QA_REJECTED,
          reviewedAt: new Date(),
        },
      });

      await this.createAuditLog({
        action: 'INSPECTION_REJECTED',
        entityType: 'QualityInspection',
        entityId: inspectionId,
        performedById: inspection.inspectedById,
        details: JSON.stringify({ orderId, stageId, reason }),
      });

      return updated;
    });
  }

  async listInspections(orderId?: string) {
    return this.prisma.qualityInspection.findMany({
      where: orderId ? { productionOrderId: orderId } : undefined,
      include: {
        stage: true,
        inspectedBy: { select: { username: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getQualityThresholds() {
    return this.prisma.qualityThreshold.findMany({
      where: { isActive: true },
      orderBy: { stageName: 'asc' },
    });
  }

  private async getThresholdForStage(orderId: string, stageId: string) {
    const stage = await this.getStageOrThrow(orderId, stageId);
    const threshold = await this.prisma.qualityThreshold.findFirst({
      where: {
        stageName: stage.stageName,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { stage, threshold };
  }

  async setQualityThreshold(
    stageName: ProductionStageName,
    body: {
      maxDefectsPerHundred: number;
      acceptanceCriteria: string;
      isActive?: boolean;
    },
    userId: string,
  ) {
    return this.prisma.qualityThreshold.upsert({
      where: { stageName },
      update: {
        maxDefectsPerHundred: body.maxDefectsPerHundred,
        acceptanceCriteria: body.acceptanceCriteria,
        isActive: body.isActive ?? true,
      },
      create: {
        stageName,
        maxDefectsPerHundred: body.maxDefectsPerHundred,
        acceptanceCriteria: body.acceptanceCriteria,
        isActive: body.isActive ?? true,
        createdById: userId,
      },
    });
  }

  async upsertQualityThreshold(
    stageName: ProductionStageName,
    body: {
      maxDefectsPerHundred: number;
      acceptanceCriteria: string;
      isActive?: boolean;
    },
    userId: string,
  ) {
    return this.setQualityThreshold(stageName, body, userId);
  }

  async getQualityDashboard() {
    const [thresholds, inspections, orders] = await Promise.all([
      this.getQualityThresholds(),
      this.prisma.qualityInspection.findMany({
        include: {
          stage: true,
          productionOrder: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.productionOrder.count(),
    ]);

    return {
      totalOrders: orders,
      totalInspections: inspections.length,
      activeThresholds: thresholds.length,
      latestInspections: inspections.slice(0, 20),
      thresholds,
    };
  }

  async updateIssueStatus(issueId: string, status: ProductionIssueStatus) {
    return this.prisma.productionIssue.update({
      where: { id: issueId },
      data: { status },
    });
  }

  async updateInspection(
    orderId: string,
    stageId: string,
    inspectionId: string,
    userId: string,
    body: {
      measurements?: string;
      defects?: number;
      notes?: string;
      evidence?: string;
    },
  ) {
    const inspection = await this.prisma.qualityInspection.findUnique({
      where: { id: inspectionId },
    });
    if (!inspection || inspection.stageId !== stageId) {
      throw new NotFoundException('QA inspection not found');
    }

    const updated = await this.prisma.qualityInspection.update({
      where: { id: inspectionId },
      data: {
        measurements: body.measurements ?? inspection.measurements,
        defects: body.defects ?? inspection.defects,
        notes: body.notes ?? inspection.notes,
        evidence: body.evidence ?? inspection.evidence,
      },
    });

    await this.createAuditLog({
      action: 'INSPECTION_UPDATED',
      entityType: 'QualityInspection',
      entityId: inspectionId,
      performedById: userId,
      details: JSON.stringify({
        previous: {
          measurements: inspection.measurements,
          defects: inspection.defects,
          notes: inspection.notes,
          evidence: inspection.evidence,
        },
        updated: body,
      }),
    });

    return updated;
  }

  async getProcessImprovements() {
    return this.prisma.processImprovement.findMany({
      include: {
        suggestedBy: { select: { username: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createProcessImprovement(
    body: {
      title: string;
      description: string;
      category: string;
      expectedImpact?: string;
    },
    userId: string,
  ) {
    return this.prisma.processImprovement.create({
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        expectedImpact: body.expectedImpact,
        suggestedById: userId,
      },
    });
  }

  async updateProcessImprovement(id: string, status: string) {
    return this.prisma.processImprovement.update({
      where: { id },
      data: { status },
    });
  }

  async createAuditLog(data: {
    action: string;
    entityType: string;
    entityId: string;
    performedById: string;
    details?: string;
  }) {
    return this.prisma.qualityAuditLog.create({ data });
  }

  async getAuditLogs(inspectionId: string) {
    return this.prisma.qualityAuditLog.findMany({
      where: {
        entityType: 'QualityInspection',
        entityId: inspectionId,
      },
      include: {
        performedBy: { select: { username: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSummaryReport() {
    const [orders, issues, outputs] = await Promise.all([
      this.prisma.productionOrder.findMany({
        include: { stages: true },
      }),
      this.prisma.productionIssue.findMany(),
      this.prisma.productionOutput.findMany(),
    ]);

    return {
      completed: orders.filter(
        (order) => order.status === ProductionOrderStatus.COMPLETED,
      ).length,
      inProgress: orders.filter(
        (order) => order.status === ProductionOrderStatus.IN_PROGRESS,
      ).length,
      cancelled: orders.filter(
        (order) => order.status === ProductionOrderStatus.CANCELLED,
      ).length,
      openIssues: issues.filter(
        (issue) => issue.status === ProductionIssueStatus.OPEN,
      ).length,
      totalOutputs: outputs.length,
    };
  }

  async getPerformanceReport() {
    const orders = await this.prisma.productionOrder.findMany({
      include: { stages: true, outputs: true },
    });

    const totalGood = orders.reduce(
      (sum, order) =>
        sum +
        order.outputs.reduce(
          (outputSum, output) => outputSum + output.goodQuantity,
          0,
        ),
      0,
    );
    const totalDefective = orders.reduce(
      (sum, order) =>
        sum +
        order.outputs.reduce(
          (outputSum, output) => outputSum + output.defectiveQuantity,
          0,
        ),
      0,
    );

    return {
      totalGood,
      totalDefective,
      defectRate:
        totalGood + totalDefective > 0
          ? totalDefective / (totalGood + totalDefective)
          : 0,
      byStage: Object.fromEntries(
        STAGE_ORDER.map((stageName) => [
          stageName,
          {
            good: orders
              .flatMap((order) =>
                order.outputs.filter((output) => output.stageId),
              )
              .reduce((sum, output) => sum + output.goodQuantity, 0),
            defective: orders
              .flatMap((order) =>
                order.outputs.filter((output) => output.stageId),
              )
              .reduce((sum, output) => sum + output.defectiveQuantity, 0),
          },
        ]),
      ),
    };
  }

  async getMonitoringSummary() {
    const orders = await this.prisma.productionOrder.findMany({
      include: {
        stages: { orderBy: { stageOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const byStatus = {
      Planned: 0,
      InProgress: 0,
      Completed: 0,
      Stopped: 0,
      Cancelled: 0,
    };

    const ordersWithProgressPercent = orders.map((order) => {
      const stageCount = order.stages.length || 4;
      const completedStages = order.stages.filter(
        (stage) => stage.status === ProductionStageStatus.QA_APPROVED,
      ).length;
      const progressPercent =
        stageCount > 0 ? Math.round((completedStages / stageCount) * 100) : 0;

      if (order.status === ProductionOrderStatus.PLANNED) byStatus.Planned += 1;
      if (order.status === ProductionOrderStatus.IN_PROGRESS)
        byStatus.InProgress += 1;
      if (order.status === ProductionOrderStatus.COMPLETED)
        byStatus.Completed += 1;
      if (order.status === ProductionOrderStatus.STOPPED) byStatus.Stopped += 1;
      if (order.status === ProductionOrderStatus.CANCELLED)
        byStatus.Cancelled += 1;

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        product: order.productName,
        targetQty: order.targetQuantity,
        completedStages,
        totalStages: stageCount,
        progressPercent,
        status: order.status,
        stopped: order.status === ProductionOrderStatus.STOPPED,
      };
    });

    return {
      totalOrders: orders.length,
      byStatus,
      ordersWithProgressPercent,
    };
  }

  async requestRelease(orderId: string, userId: string) {
    const order = await this.getOrderOrThrow(orderId);
    if (order.status === ProductionOrderStatus.COMPLETED) {
      throw new BadRequestException('Order has already been released');
    }
    if (order.assignedSupervisorId !== userId) {
      throw new BadRequestException(
        'Only the assigned supervisor can request release of this order',
      );
    }

    const incompleteStage = order.stages.find(
      (stage) => stage.status !== ProductionStageStatus.QA_APPROVED,
    );
    if (incompleteStage) {
      throw new BadRequestException(
        'All stages must be QA approved before requesting release',
      );
    }

    if (order.releaseRequestStatus === 'PENDING') {
      throw new BadRequestException(
        'A release request is already pending for this order',
      );
    }
    if (order.releaseRequestStatus === 'APPROVED') {
      throw new BadRequestException(
        'This order has already been released to inventory',
      );
    }

    const updated = await this.prisma.productionOrder.update({
      where: { id: orderId },
      data: {
        releaseRequestStatus: 'PENDING',
        releaseRequestedById: userId,
        releaseRequestedAt: new Date(),
        releaseRejectionReason: null,
      },
    });

    const approverRecipients = await this.client.user.findMany({
      where: {
        roles: {
          some: {
            name: { in: ['QA_MANAGER', 'STOREKEEPER', 'ADMIN'] },
          },
        },
      },
      select: { id: true },
    });
    if (approverRecipients.length > 0) {
      await this.notificationsService.createForUsers(
        approverRecipients.map((recipient: { id: string }) => recipient.id),
        {
          title: 'Release request awaiting approval',
          message: `Supervisor has requested release of order ${order.orderNumber} (${order.productName}) to finished-goods inventory.`,
          type: 'RELEASE_REQUEST',
          urgent: false,
        },
      );
    }

    return {
      orderId: updated.id,
      status: updated.releaseRequestStatus,
      requestedAt: updated.releaseRequestedAt,
      message: 'Release request submitted and sent for approval',
    };
  }

  async rejectRelease(orderId: string, userId: string, reason: string) {
    const order = await this.getOrderOrThrow(orderId);
    if (order.status === ProductionOrderStatus.COMPLETED) {
      throw new BadRequestException('Order has already been released');
    }
    if (order.releaseRequestStatus !== 'PENDING') {
      throw new BadRequestException(
        'No pending release request to reject on this order',
      );
    }
    if (!reason || !reason.trim()) {
      throw new BadRequestException('A rejection reason is required');
    }

    const updated = await this.prisma.productionOrder.update({
      where: { id: orderId },
      data: {
        releaseRequestStatus: 'REJECTED',
        releaseApprovedById: userId,
        releaseApprovedAt: new Date(),
        releaseRejectionReason: reason.trim(),
      },
    });

    if (order.releaseRequestedById) {
      await this.notificationsService.createForUsers(
        [order.releaseRequestedById],
        {
          title: 'Release request rejected',
          message: `Release of order ${order.orderNumber} (${order.productName}) was rejected. Reason: ${reason.trim()}`,
          type: 'RELEASE_REJECTED',
          urgent: true,
        },
      );
    }

    return {
      orderId: updated.id,
      status: updated.releaseRequestStatus,
      rejectedReason: updated.releaseRejectionReason,
      message: 'Release request rejected and supervisor notified',
    };
  }

  async releaseOrder(orderId: string, userId: string) {
    const order = await this.getOrderOrThrow(orderId);
    if (order.status === ProductionOrderStatus.COMPLETED) {
      throw new BadRequestException('Order has already been released');
    }

    const incompleteStage = order.stages.find(
      (stage) => stage.status !== ProductionStageStatus.QA_APPROVED,
    );
    if (incompleteStage) {
      throw new BadRequestException(
        'All stages must be QA approved before release',
      );
    }

    // A release request must have been raised by the assigned supervisor
    // before the approver (QA/Storekeeper/Admin) can release the order.
    if (order.releaseRequestStatus !== 'PENDING') {
      throw new BadRequestException(
        'Order is not awaiting release. The assigned supervisor must request release before it can be approved.',
      );
    }

    const finishedSku = order.productCode || order.orderNumber;
    const finishedName = order.productName || order.orderNumber;
    // Use the order's planned good quantity (targetQuantity) as the produced
    // quantity. Sum-of-outputs is unreliable when supervisors have not yet
    // recorded a final output row, which previously resulted in 0 units being
    // moved to finished-goods inventory.
    const recordedGoodQty = order.outputs.reduce(
      (sum, output) => sum + output.goodQuantity,
      0,
    );
    const producedQty =
      recordedGoodQty > 0 ? recordedGoodQty : order.targetQuantity;
    // Finished goods use a low minimum threshold so the storekeeper can still
    // see "running low" alerts without paging on every release.
    const finishedMinThreshold = Math.max(
      0,
      Math.ceil(producedQty * 0.1),
    );

    await this.prisma.$transaction(async (tx) => {
      const finished = await tx.inventoryItem.findUnique({
        where: { sku: finishedSku },
      });
      if (finished) {
        await tx.inventoryItem.update({
          where: { sku: finishedSku },
          data: { quantity: { increment: producedQty } },
        });
      } else {
        await tx.inventoryItem.create({
          data: {
            name: finishedName,
            sku: finishedSku,
            category: 'FINISHED_GOOD' as any,
            quantity: producedQty,
            unit: 'pcs',
            minThreshold: finishedMinThreshold,
          },
        });
      }

      await tx.productionOrder.update({
        where: { id: orderId },
        data: {
          status: ProductionOrderStatus.COMPLETED,
          currentStage: 'PACKING',
          releaseRequestStatus: 'APPROVED',
          releaseApprovedById: userId,
          releaseApprovedAt: new Date(),
        },
      });
    });

    const releaseRecipients = Array.from(
      new Set(
        [order.assignedSupervisorId, order.createdByManagerId].filter(
          (id): id is string => Boolean(id),
        ),
      ),
    );
    if (releaseRecipients.length > 0) {
      await this.notificationsService.createForUsers(releaseRecipients, {
        title: 'Order released to inventory',
        message: `Order ${order.orderNumber} (${order.productName}) has been released — ${producedQty} unit${producedQty === 1 ? '' : 's'} added to finished-goods inventory.`,
        type: 'PRODUCTION_RELEASED',
        urgent: false,
      });
    }

    return {
      orderId,
      releasedBy: userId,
      releasedQuantity: producedQty,
      minThreshold: finishedMinThreshold,
      message: 'Final product released to finished goods inventory',
    };
  }

  async getQualityReport(params: {
    from?: string;
    to?: string;
    productId?: string;
  }) {
    const inspections = await this.prisma.qualityInspection.findMany({
      where: {
        createdAt: {
          gte: params.from ? new Date(params.from) : undefined,
          lte: params.to ? new Date(params.to) : undefined,
        },
      },
      include: { stage: true, productionOrder: true },
      orderBy: { createdAt: 'asc' },
    });

    const totalInspections = inspections.length;
    const passes = inspections.filter(
      (inspection) =>
        inspection.status === 'APPROVED' ||
        inspection.result === 'APPROVED' ||
        inspection.result === 'AUTO_REJECTED',
    ).length;
    const defects = inspections.reduce(
      (sum, inspection) => sum + (inspection.defects || 0),
      0,
    );

    const weeklyTrend = inspections.reduce<
      Record<string, { total: number; defects: number }>
    >((acc, inspection) => {
      const date = inspection.createdAt;
      const start = new Date(date);
      const day = start.getUTCDay() || 7;
      start.setUTCDate(start.getUTCDate() - day + 1);
      start.setUTCHours(0, 0, 0, 0);
      const weekKey = `${start.getUTCFullYear()}-W${String(
        Math.ceil(
          ((start.getTime() -
            new Date(Date.UTC(start.getUTCFullYear(), 0, 1)).getTime()) /
            86400000 +
            1) /
            7,
        ),
      ).padStart(2, '0')}`;
      acc[weekKey] ??= { total: 0, defects: 0 };
      acc[weekKey].total += 1;
      acc[weekKey].defects += inspection.defects || 0;
      return acc;
    }, {});

    const defectTrend = Object.entries(weeklyTrend).map(([week, value]) => ({
      week,
      defectRate:
        value.total > 0
          ? Number(((value.defects / value.total) * 100).toFixed(2))
          : 0,
    }));

    const topDefectTypes = Object.entries(
      inspections.reduce<Record<string, number>>((acc, inspection) => {
        const key = inspection.result || 'UNKNOWN';
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {}),
    )
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const stageBreakdown = Object.fromEntries(
      STAGE_ORDER.map((stageName) => {
        const stageInspections = inspections.filter(
          (inspection) => inspection.stage?.stageName === stageName,
        );
        const stagePasses = stageInspections.filter(
          (inspection) =>
            inspection.status === 'APPROVED' ||
            inspection.result === 'APPROVED',
        ).length;
        const stageDefects = stageInspections.reduce(
          (sum, inspection) => sum + (inspection.defects || 0),
          0,
        );
        const passRate =
          stageInspections.length > 0
            ? Number(((stagePasses / stageInspections.length) * 100).toFixed(2))
            : 0;

        return [
          stageName,
          {
            passRate,
            inspections: stageInspections.length,
            defects: stageDefects,
            passes: stagePasses,
            rejects: stageInspections.length - stagePasses,
          },
        ];
      }),
    );

    return {
      totalInspections,
      passRate:
        totalInspections > 0
          ? Number(((passes / totalInspections) * 100).toFixed(2))
          : 0,
      defectTrend,
      topDefectTypes,
      stageBreakdown,
      totalDefects: defects,
    };
  }
}
