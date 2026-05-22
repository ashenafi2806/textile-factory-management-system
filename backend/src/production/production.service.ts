// import {
//   BadRequestException,
//   Injectable,
//   NotFoundException,
// } from '@nestjs/common';
// import {
//   ProductionIssuePriority,
//   ProductionIssueStatus,
//   ProductionIssueType,
//   ProductionOrderStatus,
//   ProductionStageName,
//   ProductionStageStatus,
// } from '@prisma/client';
// import { MailService } from '../mail/mail.service';
// import { PrismaService } from '../prisma/prisma.service';

// @Injectable()
// export class ProductionService {
//   constructor(
//     private readonly prisma: PrismaService,
//     private readonly mailService: MailService,
//   ) {}

//   async createOrder(data: {
//     productName: string;
//     productCode: string;
//     targetQuantity: number;
//     deadline: string;
//     assignedSupervisorId?: string;
//     createdByManagerId: string;
//     bomItems?: Array<{
//       materialId: string;
//       requiredQuantity: number;
//       unit: string;
//     }>;
//   }) {
//     const orderNumber = `PO-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

//     return this.prisma.productionOrder.create({
//       data: {
//         orderNumber,
//         productName: data.productName,
//         productCode: data.productCode,
//         targetQuantity: data.targetQuantity,
//         deadline: new Date(data.deadline),
//         assignedSupervisorId: data.assignedSupervisorId,
//         createdByManagerId: data.createdByManagerId,
//         bomItems: data.bomItems?.length
//           ? { create: data.bomItems.map((item) => ({ ...item })) }
//           : undefined,
//         stages: {
//           create: [
//             { stageName: ProductionStageName.CUTTING, stageOrder: 1 },
//             { stageName: ProductionStageName.SEWING, stageOrder: 2 },
//             { stageName: ProductionStageName.FINISHING, stageOrder: 3 },
//             { stageName: ProductionStageName.PACKING, stageOrder: 4 },
//           ],
//         },
//       },
//       include: {
//         bomItems: { include: { material: true } },
//         stages: true,
//         assignedSupervisor: {
//           select: { id: true, username: true, email: true },
//         },
//         createdByManager: { select: { id: true, username: true, email: true } },
//       },
//     });
//   }

//   async getOrderById(id: string) {
//     const order = await this.prisma.productionOrder.findUnique({
//       where: { id },
//       include: {
//         bomItems: { include: { material: true } },
//         stages: {
//           orderBy: { stageOrder: 'asc' },
//           include: {
//             outputs: {
//               include: { supervisor: { select: { id: true, username: true } } },
//               orderBy: { createdAt: 'desc' },
//             },
//             issues: {
//               include: { reportedBy: { select: { id: true, username: true } } },
//               orderBy: { createdAt: 'desc' },
//             },
//           },
//         },
//         outputs: {
//           include: { supervisor: { select: { id: true, username: true } } },
//           orderBy: { createdAt: 'desc' },
//         },
//         issues: {
//           include: { reportedBy: { select: { id: true, username: true } } },
//           orderBy: { createdAt: 'desc' },
//         },
//         assignedSupervisor: {
//           select: { id: true, username: true, email: true },
//         },
//         createdByManager: { select: { id: true, username: true, email: true } },
//       },
//     });
//     if (!order) throw new NotFoundException('Production order not found');
//     return order;
//   }

//   async listOrders(user: any) {
//     if (
//       user.roles.includes('PRODUCTION_MANAGER') ||
//       user.roles.includes('ADMIN')
//     ) {
//       return this.listAllOrders();
//     }
//     if (user.roles.includes('PRODUCTION_SUPERVISOR')) {
//       return this.prisma.productionOrder.findMany({
//         where: { assignedSupervisorId: user.userId },
//         include: {
//           bomItems: { include: { material: true } },
//           stages: {
//             orderBy: { stageOrder: 'asc' },
//             include: {
//               outputs: {
//                 include: {
//                   supervisor: { select: { id: true, username: true } },
//                 },
//                 orderBy: { createdAt: 'desc' },
//               },
//               issues: {
//                 include: {
//                   reportedBy: { select: { id: true, username: true } },
//                 },
//                 orderBy: { createdAt: 'desc' },
//               },
//             },
//           },
//           outputs: {
//             include: { supervisor: { select: { id: true, username: true } } },
//             orderBy: { createdAt: 'desc' },
//           },
//           issues: {
//             include: { reportedBy: { select: { id: true, username: true } } },
//             orderBy: { createdAt: 'desc' },
//           },
//           assignedSupervisor: {
//             select: { id: true, username: true, email: true },
//           },
//           createdByManager: {
//             select: { id: true, username: true, email: true },
//           },
//         },
//         orderBy: { createdAt: 'desc' },
//       });
//     }
//     throw new BadRequestException(
//       'User does not have access to production orders',
//     );
//   }

//   private async listAllOrders() {
//     return this.prisma.productionOrder.findMany({
//       include: {
//         bomItems: { include: { material: true } },
//         stages: {
//           orderBy: { stageOrder: 'asc' },
//           include: {
//             outputs: {
//               include: { supervisor: { select: { id: true, username: true } } },
//               orderBy: { createdAt: 'desc' },
//             },
//             issues: {
//               include: { reportedBy: { select: { id: true, username: true } } },
//               orderBy: { createdAt: 'desc' },
//             },
//           },
//         },
//         outputs: {
//           include: { supervisor: { select: { id: true, username: true } } },
//           orderBy: { createdAt: 'desc' },
//         },
//         issues: {
//           include: { reportedBy: { select: { id: true, username: true } } },
//           orderBy: { createdAt: 'desc' },
//         },
//         assignedSupervisor: {
//           select: { id: true, username: true, email: true },
//         },
//         createdByManager: { select: { id: true, username: true, email: true } },
//       },
//       orderBy: { createdAt: 'desc' },
//     });
//   }

//   async updateOrder(id: string, data: any) {
//     return this.prisma.productionOrder.update({
//       where: { id },
//       data: {
//         productName: data.productName,
//         productCode: data.productCode,
//         targetQuantity: data.targetQuantity,
//         deadline: data.deadline ? new Date(data.deadline) : undefined,
//         assignedSupervisorId: data.assignedSupervisorId,
//         status: data.status,
//       },
//     });
//   }

//   async cancelOrder(id: string) {
//     return this.prisma.productionOrder.update({
//       where: { id },
//       data: { status: ProductionOrderStatus.CANCELLED },
//     });
//   }

//   async assignSupervisor(orderId: string, supervisorId: string) {
//     return this.prisma.productionOrder.update({
//       where: { id: orderId },
//       data: { assignedSupervisorId: supervisorId },
//     });
//   }

//   async checkMaterial(orderId: string) {
//     const order = await this.prisma.productionOrder.findUnique({
//       where: { id: orderId },
//       include: { bomItems: { include: { material: true } } },
//     });
//     if (!order) throw new NotFoundException('Production order not found');
//     const items = order.bomItems.map((bom) => ({
//       materialId: bom.materialId,
//       materialName: bom.material.name,
//       requiredQuantity: bom.requiredQuantity,
//       unit: bom.unit,
//       currentStock: bom.material.quantity,
//       available: bom.material.quantity >= bom.requiredQuantity,
//       shortage: Math.max(0, bom.requiredQuantity - bom.material.quantity),
//     }));
//     return {
//       orderId,
//       readyToStart: items.every((item) => item.available),
//       items,
//     };
//   }

//   async startStage(orderId: string, stageId: string) {
//     const stage = await this.validateStageOwnership(orderId, stageId);
//     if (stage.status === ProductionStageStatus.COMPLETED) {
//       throw new BadRequestException('Cannot start a completed stage');
//     }
//     return this.prisma.$transaction(async (tx) => {
//       await tx.productionOrder.update({
//         where: { id: orderId },
//         data: {
//           status: ProductionOrderStatus.IN_PROGRESS,
//           currentStage: stageId,
//         },
//       });
//       return tx.productionStage.update({
//         where: { id: stageId },
//         data: {
//           status: ProductionStageStatus.IN_PROGRESS,
//           startedAt: new Date(),
//         },
//       });
//     });
//   }

//   async stopStage(orderId: string, stageId: string) {
//     const stage = await this.validateStageOwnership(orderId, stageId);
//     if (stage.status !== ProductionStageStatus.IN_PROGRESS) {
//       throw new BadRequestException('Only an in-progress stage can be stopped');
//     }
//     return this.prisma.$transaction(async (tx) => {
//       await tx.productionOrder.update({
//         where: { id: orderId },
//         data: { status: ProductionOrderStatus.STOPPED },
//       });
//       return tx.productionStage.update({
//         where: { id: stageId },
//         data: { status: ProductionStageStatus.PENDING },
//       });
//     });
//   }

//   async resumeStage(orderId: string, stageId: string) {
//     const stage = await this.validateStageOwnership(orderId, stageId);
//     if (
//       stage.status !== ProductionStageStatus.PENDING &&
//       stage.status !== ProductionStageStatus.QA_REJECTED
//     ) {
//       throw new BadRequestException('Only a pending stage can be resumed');
//     }
//     return this.prisma.$transaction(async (tx) => {
//       await tx.productionOrder.update({
//         where: { id: orderId },
//         data: {
//           status: ProductionOrderStatus.IN_PROGRESS,
//           currentStage: stageId,
//         },
//       });
//       return tx.productionStage.update({
//         where: { id: stageId },
//         data: {
//           status: ProductionStageStatus.IN_PROGRESS,
//           startedAt: stage.startedAt ?? new Date(),
//         },
//       });
//     });
//   }

//   async completeStage(orderId: string, stageId: string) {
//     const stage = await this.validateStageOwnership(orderId, stageId);
//     if (stage.status !== ProductionStageStatus.IN_PROGRESS) {
//       throw new BadRequestException(
//         'Only an in-progress stage can be completed',
//       );
//     }
//     const pendingQAStage = await this.prisma.productionStage.update({
//       where: { id: stageId },
//       data: {
//         status: ProductionStageStatus.QA_PENDING,
//         completedAt: new Date(),
//       },
//     });
//     await this.prisma.productionOrder.update({
//       where: { id: orderId },
//       data: {
//         status: ProductionOrderStatus.IN_PROGRESS,
//         currentStage: stageId,
//       },
//     });
//     return pendingQAStage;
//   }

//   async qaReview(
//     orderId: string,
//     stageId: string,
//     action: 'APPROVE' | 'REJECT',
//   ) {
//     await this.validateStageOwnership(orderId, stageId);
//     const status =
//       action === 'APPROVE'
//         ? ProductionStageStatus.QA_APPROVED
//         : ProductionStageStatus.QA_REJECTED;

//     return this.prisma.$transaction(async (tx) => {
//       // If QA approves, mark QA_APPROVED and advance order if all stages are approved
//       if (status === ProductionStageStatus.QA_APPROVED) {
//         const updatedStage = await tx.productionStage.update({
//           where: { id: stageId },
//           data: { status },
//         });
//         const remaining = await tx.productionStage.count({
//           where: {
//             productionOrderId: orderId,
//             status: { not: ProductionStageStatus.QA_APPROVED },
//           },
//         });
//         if (remaining === 0) {
//           await tx.productionOrder.update({
//             where: { id: orderId },
//             data: { status: ProductionOrderStatus.COMPLETED },
//           });
//         } else {
//           await tx.productionOrder.update({
//             where: { id: orderId },
//             data: { status: ProductionOrderStatus.IN_PROGRESS },
//           });
//         }
//         return updatedStage;
//       }

//       // If QA rejects, revert stage back to IN_PROGRESS so supervisor can fix and resubmit
//       const updatedStage = await tx.productionStage.update({
//         where: { id: stageId },
//         data: {
//           status: ProductionStageStatus.IN_PROGRESS,
//           // reset completedAt so work can continue
//           completedAt: null,
//           startedAt: new Date(),
//         },
//       });

//       await tx.productionOrder.update({
//         where: { id: orderId },
//         data: { status: ProductionOrderStatus.IN_PROGRESS },
//       });

//       return updatedStage;
//     });
//   }

//   async getOutputHistory(orderId: string) {
//     return this.prisma.productionOutput.findMany({
//       where: { productionOrderId: orderId },
//       include: {
//         supervisor: { select: { id: true, username: true, email: true } },
//         stage: true,
//       },
//       orderBy: { createdAt: 'desc' },
//     });
//   }

//   async getIssues(orderId: string) {
//     return this.prisma.productionIssue.findMany({
//       where: { productionOrderId: orderId },
//       include: {
//         reportedBy: { select: { id: true, username: true, email: true } },
//         stage: true,
//       },
//       orderBy: { createdAt: 'desc' },
//     });
//   }

//   async recordOutput(data: {
//     productionOrderId: string;
//     stageId: string;
//     supervisorId: string;
//     shiftDate: string;
//     goodQuantity: number;
//     defectiveQuantity?: number;
//     notes?: string;
//   }) {
//     return this.prisma.$transaction(async (tx) => {
//       const output = await tx.productionOutput.create({
//         data: {
//           productionOrderId: data.productionOrderId,
//           stageId: data.stageId,
//           supervisorId: data.supervisorId,
//           shiftDate: new Date(data.shiftDate),
//           goodQuantity: data.goodQuantity,
//           defectiveQuantity: data.defectiveQuantity ?? 0,
//           notes: data.notes,
//         },
//       });

//       await tx.productionOrder.update({
//         where: { id: data.productionOrderId },
//         data: {
//           status: ProductionOrderStatus.IN_PROGRESS,
//           currentStage: data.stageId,
//         },
//       });

//       await tx.productionStage.update({
//         where: { id: data.stageId },
//         data: {
//           status: ProductionStageStatus.IN_PROGRESS,
//           startedAt: new Date(),
//         },
//       });

//       return output;
//     });
//   }

//   async createIssue(data: {
//     productionOrderId: string;
//     stageId?: string;
//     reportedById: string;
//     issueType: ProductionIssueType;
//     description: string;
//     priority?: ProductionIssuePriority;
//   }) {
//     const issue = await this.prisma.productionIssue.create({
//       data: {
//         productionOrderId: data.productionOrderId,
//         stageId: data.stageId,
//         reportedById: data.reportedById,
//         issueType: data.issueType,
//         description: data.description,
//         priority: data.priority ?? ProductionIssuePriority.NORMAL,
//       },
//     });

//     // Auto-notify maintenance team for critical issues
//     if (issue.priority === ProductionIssuePriority.CRITICAL) {
//       try {
//         const maintenanceUsers = await this.prisma.user.findMany({
//           where: {
//             roles: {
//               some: {
//                 name: { in: ['MAINTENANCE_MANAGER', 'MAINTENANCE_TECHNICIAN'] },
//               },
//             },
//           },
//           select: { email: true, username: true },
//         });

//         const subject = `CRITICAL: Production issue reported for order ${issue.productionOrderId}`;
//         const html = `<p>Priority: <strong>CRITICAL</strong></p><p>Issue: ${issue.description}</p><p>Order: ${issue.productionOrderId}</p>`;

//         for (const u of maintenanceUsers) {
//           if (u.email) {
//             // best-effort notify; don't block main flow on failure
//             this.mailService
//               .sendAlertEmail(u.email, subject, html)
//               .catch((e) =>
//                 console.error('Failed to notify maintenance user', u.email, e),
//               );
//           }
//         }
//       } catch (err) {
//         console.error(
//           'Error while notifying maintenance team for critical issue',
//           err,
//         );
//       }
//     }

//     return issue;
//   }

//   async updateIssueStatus(id: string, status: ProductionIssueStatus) {
//     return this.prisma.productionIssue.update({
//       where: { id },
//       data: { status },
//     });
//   }

//   async getSummaryReport() {
//     const total = await this.prisma.productionOrder.count();
//     const inProgress = await this.prisma.productionOrder.count({
//       where: { status: ProductionOrderStatus.IN_PROGRESS },
//     });
//     const completed = await this.prisma.productionOrder.count({
//       where: { status: ProductionOrderStatus.COMPLETED },
//     });
//     const cancelled = await this.prisma.productionOrder.count({
//       where: { status: ProductionOrderStatus.CANCELLED },
//     });
//     const openIssues = await this.prisma.productionIssue.count({
//       where: { status: ProductionIssueStatus.OPEN },
//     });
//     return { total, inProgress, completed, cancelled, openIssues };
//   }

//   async getPerformanceReport() {
//     const outputs = await this.prisma.productionOutput.findMany({
//       include: { stage: true, productionOrder: true },
//       orderBy: { createdAt: 'desc' },
//     });
//     const summary = outputs.reduce(
//       (acc, item) => {
//         acc.totalOutputs += 1;
//         acc.totalGood += item.goodQuantity;
//         acc.totalDefective += item.defectiveQuantity;
//         return acc;
//       },
//       { totalOutputs: 0, totalGood: 0, totalDefective: 0 },
//     );
//     const defectRate =
//       summary.totalGood + summary.totalDefective > 0
//         ? summary.totalDefective / (summary.totalGood + summary.totalDefective)
//         : 0;
//     return {
//       totalOutputs: summary.totalOutputs,
//       totalGood: summary.totalGood,
//       totalDefective: summary.totalDefective,
//       defectRate,
//       byStage: outputs.reduce(
//         (acc, item) => {
//           const key = item.stage.stageName;
//           if (!acc[key]) acc[key] = { good: 0, defective: 0, count: 0 };
//           acc[key].good += item.goodQuantity;
//           acc[key].defective += item.defectiveQuantity;
//           acc[key].count += 1;
//           return acc;
//         },
//         {} as Record<
//           string,
//           { good: number; defective: number; count: number }
//         >,
//       ),
//     };
//   }

//   private async validateStageOwnership(orderId: string, stageId: string) {
//     const stage = await this.prisma.productionStage.findUnique({
//       where: { id: stageId },
//     });
//     if (!stage || stage.productionOrderId !== orderId) {
//       throw new NotFoundException('Stage does not belong to production order');
//     }
//     return stage;
//   }
// }

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  ProductionIssuePriority,
  ProductionIssueStatus,
  ProductionIssueType,
  ProductionOrderStatus,
  ProductionStageName,
  ProductionStageStatus,
} from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductionOrderDto } from './dto/create-production-order.dto';
import { UpdateProductionOrderDto } from './dto/update-production-order.dto';
import { RecordOutputDto } from './dto/record-output.dto';
import { ReportIssueDto } from './dto/report-issue.dto';

@Injectable()
export class ProductionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  // ============= ORDER MANAGEMENT =============

  async createOrder(body: CreateProductionOrderDto, managerId: string) {
    const orderNumber = `PO-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    return this.prisma.productionOrder.create({
      data: {
        orderNumber,
        productName: body.productName,
        productCode: body.productCode,
        targetQuantity: body.targetQuantity,
        deadline: new Date(body.deadline),
        assignedSupervisorId: body.assignedSupervisorId,
        createdByManagerId: managerId,
        bomItems: body.bomItems?.length
          ? { create: body.bomItems.map((item) => ({ ...item })) }
          : undefined,
        stages: {
          create: [
            { stageName: ProductionStageName.CUTTING, stageOrder: 1 },
            { stageName: ProductionStageName.SEWING, stageOrder: 2 },
            { stageName: ProductionStageName.FINISHING, stageOrder: 3 },
            { stageName: ProductionStageName.PACKING, stageOrder: 4 },
          ],
        },
      },
      include: {
        bomItems: { include: { material: true } },
        stages: true,
        assignedSupervisor: {
          select: { id: true, username: true, email: true },
        },
        createdByManager: { select: { id: true, username: true, email: true } },
      },
    });
  }

  async listOrders(user: any) {
    if (
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      user.roles.includes('PRODUCTION_MANAGER') ||
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      user.roles.includes('ADMIN') ||
      // Allow QA roles to list orders for QA dashboard
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      user.roles.includes('QA_MANAGER') ||
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      user.roles.includes('QA_STAFF')
    ) {
      return this.listAllOrders();
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    if (user.roles.includes('PRODUCTION_SUPERVISOR')) {
      return this.prisma.productionOrder.findMany({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        where: { assignedSupervisorId: user.userId },
        include: {
          bomItems: { include: { material: true } },
          stages: {
            orderBy: { stageOrder: 'asc' },
            include: {
              outputs: {
                include: {
                  supervisor: { select: { id: true, username: true } },
                },
                orderBy: { createdAt: 'desc' },
              },
              issues: {
                include: {
                  reportedBy: { select: { id: true, username: true } },
                },
                orderBy: { createdAt: 'desc' },
              },
            },
          },
          outputs: {
            include: { supervisor: { select: { id: true, username: true } } },
            orderBy: { createdAt: 'desc' },
          },
          issues: {
            include: { reportedBy: { select: { id: true, username: true } } },
            orderBy: { createdAt: 'desc' },
          },
          assignedSupervisor: {
            select: { id: true, username: true, email: true },
          },
          createdByManager: {
            select: { id: true, username: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    throw new BadRequestException(
      'User does not have access to production orders',
    );
  }

  async getOrderById(id: string) {
    const order = await this.prisma.productionOrder.findUnique({
      where: { id },
      include: {
        bomItems: { include: { material: true } },
        stages: {
          orderBy: { stageOrder: 'asc' },
          include: {
            outputs: {
              include: { supervisor: { select: { id: true, username: true } } },
              orderBy: { createdAt: 'desc' },
            },
            issues: {
              include: { reportedBy: { select: { id: true, username: true } } },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        outputs: {
          include: { supervisor: { select: { id: true, username: true } } },
          orderBy: { createdAt: 'desc' },
        },
        issues: {
          include: { reportedBy: { select: { id: true, username: true } } },
          orderBy: { createdAt: 'desc' },
        },
        assignedSupervisor: {
          select: { id: true, username: true, email: true },
        },
        createdByManager: { select: { id: true, username: true, email: true } },
      },
    });

    if (!order) throw new NotFoundException('Production order not found');
    return this.withProductionSummary(order);
  }

  async updateOrder(id: string, body: UpdateProductionOrderDto) {
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
    return this.prisma.productionOrder.update({
      where: { id },
      data: { status: ProductionOrderStatus.CANCELLED },
    });
  }

  async assignSupervisor(orderId: string, supervisorId: string) {
    return this.prisma.productionOrder.update({
      where: { id: orderId },
      data: { assignedSupervisorId: supervisorId },
    });
  }

  // ============= MATERIAL MANAGEMENT =============

  async checkMaterial(orderId: string) {
    const order = await this.prisma.productionOrder.findUnique({
      where: { id: orderId },
      include: { bomItems: { include: { material: true } } },
    });

    if (!order) throw new NotFoundException('Production order not found');

    const items = order.bomItems.map((bom) => ({
      materialId: bom.materialId,
      materialName: bom.material.name,
      requiredQuantity: bom.requiredQuantity,
      unit: bom.unit,
      currentStock: bom.material.quantity,
      available: bom.material.quantity >= bom.requiredQuantity,
      shortage: Math.max(0, bom.requiredQuantity - bom.material.quantity),
    }));

    return {
      orderId,
      readyToStart: items.every((item) => item.available),
      items,
    };
  }

  // ============= STAGE MANAGEMENT =============

  async startStage(orderId: string, stageId: string) {
    const stage = await this.validateStageOwnership(orderId, stageId);

    if (stage.status === ProductionStageStatus.COMPLETED) {
      throw new BadRequestException('Cannot start a completed stage');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.productionOrder.update({
        where: { id: orderId },
        data: {
          status: ProductionOrderStatus.IN_PROGRESS,
          currentStage: stageId,
        },
      });

      return tx.productionStage.update({
        where: { id: stageId },
        data: {
          status: ProductionStageStatus.IN_PROGRESS,
          startedAt: new Date(),
        },
      });
    });
  }

  async stopStage(orderId: string, stageId: string) {
    const stage = await this.validateStageOwnership(orderId, stageId);

    if (stage.status !== ProductionStageStatus.IN_PROGRESS) {
      throw new BadRequestException('Only an in-progress stage can be stopped');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.productionOrder.update({
        where: { id: orderId },
        data: { status: ProductionOrderStatus.STOPPED },
      });

      return tx.productionStage.update({
        where: { id: stageId },
        data: { status: ProductionStageStatus.PENDING },
      });
    });
  }

  async resumeStage(orderId: string, stageId: string) {
    const stage = await this.validateStageOwnership(orderId, stageId);

    if (
      stage.status !== ProductionStageStatus.PENDING &&
      stage.status !== ProductionStageStatus.QA_REJECTED
    ) {
      throw new BadRequestException(
        'Only a pending or rejected stage can be resumed',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.productionOrder.update({
        where: { id: orderId },
        data: {
          status: ProductionOrderStatus.IN_PROGRESS,
          currentStage: stageId,
        },
      });

      return tx.productionStage.update({
        where: { id: stageId },
        data: {
          status: ProductionStageStatus.IN_PROGRESS,
          startedAt: stage.startedAt ?? new Date(),
        },
      });
    });
  }

  async completeStage(orderId: string, stageId: string) {
    const stage = await this.validateStageOwnership(orderId, stageId);

    if (stage.status !== ProductionStageStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Only an in-progress stage can be completed',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.productionOrder.update({
        where: { id: orderId },
        data: {
          status: ProductionOrderStatus.IN_PROGRESS,
          currentStage: stageId,
        },
      });

      return tx.productionStage.update({
        where: { id: stageId },
        data: {
          status: ProductionStageStatus.PENDING,
          completedAt: new Date(),
        },
      });
    });
  }

  // ============= QA MANAGEMENT =============

  async qaReview(
    orderId: string,
    stageId: string,
    action: 'APPROVE' | 'REJECT',
  ) {
    await this.validateStageOwnership(orderId, stageId);

    const status =
      action === 'APPROVE'
        ? ProductionStageStatus.QA_APPROVED
        : ProductionStageStatus.QA_REJECTED;

    return this.prisma.$transaction(async (tx) => {
      if (status === ProductionStageStatus.QA_APPROVED) {
        const updatedStage = await tx.productionStage.update({
          where: { id: stageId },
          data: { status },
        });

        const nextStage = await tx.productionStage.findFirst({
          where: {
            productionOrderId: orderId,
            stageOrder: { gt: updatedStage.stageOrder },
          },
          orderBy: { stageOrder: 'asc' },
        });

        if (nextStage) {
          // Auto-start the next stage
          await tx.productionStage.update({
            where: { id: nextStage.id },
            data: {
              status: ProductionStageStatus.IN_PROGRESS,
              startedAt: new Date(),
            },
          });

          await tx.productionOrder.update({
            where: { id: orderId },
            data: {
              status: ProductionOrderStatus.IN_PROGRESS,
              currentStage: nextStage.id,
            },
          });
        } else {
          // No next stage found; check if all are approved to complete the order
          const remaining = await tx.productionStage.count({
            where: {
              productionOrderId: orderId,
              status: { not: ProductionStageStatus.QA_APPROVED },
            },
          });

          if (remaining === 0) {
            await tx.productionOrder.update({
              where: { id: orderId },
              data: { status: ProductionOrderStatus.COMPLETED },
            });
          } else {
            await tx.productionOrder.update({
              where: { id: orderId },
              data: { status: ProductionOrderStatus.IN_PROGRESS },
            });
          }
        }

        if (updatedStage.stageName === ProductionStageName.PACKING) {
          void this.notifyPackingApproved(orderId, updatedStage.id).catch((err) => {
            console.error('Failed to notify packing approval', err);
          });
        }

        return updatedStage;
      }

      // QA REJECTED - revert stage to IN_PROGRESS
      const updatedStage = await tx.productionStage.update({
        where: { id: stageId },
        data: {
          status: ProductionStageStatus.IN_PROGRESS,
          completedAt: null,
          startedAt: new Date(),
        },
      });

      await tx.productionOrder.update({
        where: { id: orderId },
        data: { status: ProductionOrderStatus.IN_PROGRESS },
      });

      return updatedStage;
    });
  }

  // ============= OUTPUT MANAGEMENT =============

  async recordOutput(
    orderId: string,
    body: RecordOutputDto,
    supervisorId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const output = await tx.productionOutput.create({
        data: {
          productionOrderId: orderId,
          stageId: body.stageId,
          supervisorId: supervisorId,
          shiftDate: new Date(body.shiftDate),
          goodQuantity: body.goodQuantity,
          defectiveQuantity: body.defectiveQuantity ?? 0,
          notes: body.notes,
        },
      });

      await tx.productionOrder.update({
        where: { id: orderId },
        data: {
          status: ProductionOrderStatus.IN_PROGRESS,
          currentStage: body.stageId,
        },
      });

      await tx.productionStage.update({
        where: { id: body.stageId },
        data: {
          status: ProductionStageStatus.IN_PROGRESS,
          startedAt: new Date(),
        },
      });

      return output;
    });
  }

  async getOutputHistory(orderId: string) {
    return this.prisma.productionOutput.findMany({
      where: { productionOrderId: orderId },
      include: {
        supervisor: { select: { id: true, username: true, email: true } },
        stage: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============= ISSUE MANAGEMENT =============

  async reportIssue(orderId: string, body: ReportIssueDto, userId: string) {
    const issueType = this.normalizeIssueType(body.issueType);
    const issue = await this.prisma.productionIssue.create({
      data: {
        productionOrderId: orderId,
        stageId: body.stageId,
        reportedById: userId,
        issueType,
        description: body.description,
        priority: body.priority ?? ProductionIssuePriority.NORMAL,
      },
    });

    // Auto-notify maintenance team for critical issues
    if (issue.priority === ProductionIssuePriority.CRITICAL) {
      try {
        const maintenanceUsers = await this.prisma.user.findMany({
          where: {
            roles: {
              some: {
                name: { in: ['MAINTENANCE_MANAGER', 'MAINTENANCE_TECHNICIAN'] },
              },
            },
          },
          select: { email: true, username: true },
        });

        const subject = `CRITICAL: Production issue reported for order ${orderId}`;
        const html = `<p>Priority: <strong>CRITICAL</strong></p>
                      <p>Issue Type: ${body.issueType}</p>
                      <p>Description: ${body.description}</p>
                      <p>Order ID: ${orderId}</p>`;

        for (const u of maintenanceUsers) {
          if (u.email) {
            this.mailService
              .sendAlertEmail(u.email, subject, html)
              .catch((e) =>
                console.error('Failed to notify maintenance user', u.email, e),
              );
          }
        }
      } catch (err) {
        console.error(
          'Error notifying maintenance team for critical issue',
          err,
        );
      }
    }

    return issue;
  }

  async getIssues(orderId: string) {
    return this.prisma.productionIssue.findMany({
      where: { productionOrderId: orderId },
      include: {
        reportedBy: { select: { id: true, username: true, email: true } },
        stage: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateIssueStatus(issueId: string, status: ProductionIssueStatus) {
    return this.prisma.productionIssue.update({
      where: { id: issueId },
      data: { status },
    });
  }

  // ============= REPORTS =============

  async getSummaryReport() {
    const total = await this.prisma.productionOrder.count();
    const inProgress = await this.prisma.productionOrder.count({
      where: { status: ProductionOrderStatus.IN_PROGRESS },
    });
    const completed = await this.prisma.productionOrder.count({
      where: { status: ProductionOrderStatus.COMPLETED },
    });
    const cancelled = await this.prisma.productionOrder.count({
      where: { status: ProductionOrderStatus.CANCELLED },
    });
    const openIssues = await this.prisma.productionIssue.count({
      where: { status: ProductionIssueStatus.OPEN },
    });

    return { total, inProgress, completed, cancelled, openIssues };
  }

  async getPerformanceReport() {
    const outputs = await this.prisma.productionOutput.findMany({
      include: { stage: true, productionOrder: true },
      orderBy: { createdAt: 'desc' },
    });

    const summary = outputs.reduce(
      (acc, item) => {
        acc.totalOutputs += 1;
        acc.totalGood += item.goodQuantity;
        acc.totalDefective += item.defectiveQuantity;
        return acc;
      },
      { totalOutputs: 0, totalGood: 0, totalDefective: 0 },
    );

    const defectRate =
      summary.totalGood + summary.totalDefective > 0
        ? summary.totalDefective / (summary.totalGood + summary.totalDefective)
        : 0;

    return {
      totalOutputs: summary.totalOutputs,
      totalGood: summary.totalGood,
      totalDefective: summary.totalDefective,
      defectRate,
      byStage: outputs.reduce(
        (acc, item) => {
          const key = item.stage.stageName;
          if (!acc[key]) acc[key] = { good: 0, defective: 0, count: 0 };
          acc[key].good += item.goodQuantity;
          acc[key].defective += item.defectiveQuantity;
          acc[key].count += 1;
          return acc;
        },
        {} as Record<
          string,
          { good: number; defective: number; count: number }
        >,
      ),
    };
  }

  // ============= PRIVATE METHODS =============

  private async listAllOrders() {
    const orders = await this.prisma.productionOrder.findMany({
      include: {
        bomItems: { include: { material: true } },
        stages: {
          orderBy: { stageOrder: 'asc' },
          include: {
            outputs: {
              include: { supervisor: { select: { id: true, username: true } } },
              orderBy: { createdAt: 'desc' },
            },
            issues: {
              include: { reportedBy: { select: { id: true, username: true } } },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        outputs: {
          include: { supervisor: { select: { id: true, username: true } } },
          orderBy: { createdAt: 'desc' },
        },
        issues: {
          include: { reportedBy: { select: { id: true, username: true } } },
          orderBy: { createdAt: 'desc' },
        },
        assignedSupervisor: {
          select: { id: true, username: true, email: true },
        },
        createdByManager: { select: { id: true, username: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => this.withProductionSummary(order));
  }

  private async validateStageOwnership(orderId: string, stageId: string) {
    const stage = await this.prisma.productionStage.findUnique({
      where: { id: stageId },
    });

    if (!stage || stage.productionOrderId !== orderId) {
      throw new NotFoundException('Stage does not belong to production order');
    }

    return stage;
  }

  private async notifyPackingApproved(orderId: string, stageId: string) {
    const order = await this.prisma.productionOrder.findUnique({
      where: { id: orderId },
      include: {
        assignedSupervisor: { select: { email: true, username: true } },
        createdByManager: { select: { email: true, username: true } },
        outputs: {
          where: { stageId },
          select: { goodQuantity: true, defectiveQuantity: true },
        },
        stages: {
          where: { id: stageId },
          select: { stageName: true, status: true },
        },
      },
    });

    if (!order) return;

    const target = order.targetQuantity;
    const totalDefects = order.outputs.reduce(
      (sum, output) => sum + output.defectiveQuantity,
      0,
    );
    const finalGood = Math.max(0, target - totalDefects);

    const recipients = [
      order.assignedSupervisor?.email,
      order.createdByManager?.email,
    ].filter((email): email is string => Boolean(email));

    const subject = `Packing stage approved for ${order.orderNumber}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 640px; margin: auto;">
        <h2>Packing stage approved</h2>
        <p>Order <strong>${order.orderNumber}</strong> has passed QA for the packing stage.</p>
        <ul>
          <li>Target quantity: ${target}</li>
          <li>Total defects deducted: ${totalDefects}</li>
          <li>Final good output: ${finalGood}</li>
        </ul>
        <p>Please review the order and finish the production closeout.</p>
      </div>
    `;

    await Promise.all(
      recipients.map((email) => this.mailService.sendAlertEmail(email, subject, html)),
    );
  }

  private normalizeIssueType(issueType: string): ProductionIssueType {
    const normalized = issueType.trim().toUpperCase();

    if (
      normalized === 'QUALITY_DEVIATION' ||
      normalized === 'QUALITY_DEFECT'
    ) {
      return ProductionIssueType.OTHER;
    }

    if (
      normalized === 'MACHINE_FAILURE' ||
      normalized === 'MATERIAL_SHORTAGE' ||
      normalized === 'OTHER'
    ) {
      switch (normalized) {
        case 'MACHINE_FAILURE':
          return ProductionIssueType.MACHINE_FAILURE;
        case 'MATERIAL_SHORTAGE':
          return ProductionIssueType.MATERIAL_SHORTAGE;
        default:
          return ProductionIssueType.OTHER;
      }
    }

    throw new BadRequestException(`Unsupported issue type: ${issueType}`);
  }

  private withProductionSummary<
    T extends {
      targetQuantity: number;
      outputs: Array<{ goodQuantity: number; defectiveQuantity: number }>;
    },
  >(order: T) {
    const totalGoodRecorded = order.outputs.reduce(
      (sum, output) => sum + output.goodQuantity,
      0,
    );
    const totalDefectiveRecorded = order.outputs.reduce(
      (sum, output) => sum + output.defectiveQuantity,
      0,
    );
    const netGood = Math.max(0, totalGoodRecorded - totalDefectiveRecorded);

    return {
      ...order,
      totalGoodRecorded,
      totalDefectiveRecorded,
      netGood,
      remainingGood: Math.max(0, order.targetQuantity - totalDefectiveRecorded),
    };
  }
}
