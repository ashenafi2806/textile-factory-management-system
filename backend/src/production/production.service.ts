/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// import {
//   Injectable,
//   NotFoundException,
//   BadRequestException,
// } from '@nestjs/common';
// import {
//   ProductionIssuePriority,
//   ProductionIssueStatus,
//   ProductionIssueType,
//   ProductionStageName,
//   ProductionOrderStatus,
//   ProductionStageStatus,
// } from '@prisma/client';
// import { MailService } from '../mail/mail.service';
// import { PrismaService } from '../prisma/prisma.service';
// import { CreateProductionOrderDto } from './dto/create-production-order.dto';
// import { UpdateProductionOrderDto } from './dto/update-production-order.dto';
// import { RecordOutputDto } from './dto/record-output.dto';
// import { ReportIssueDto } from './dto/report-issue.dto';

// @Injectable()
// export class ProductionService {
//   constructor(
//     private readonly prisma: PrismaService,
//     private readonly mailService: MailService,
//   ) {}

//   // ============= ORDER MANAGEMENT =============

//   async createOrder(body: CreateProductionOrderDto, managerId: string) {
//     const orderNumber = `PO-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

//     return this.prisma.productionOrder.create({
//       data: {
//         orderNumber,
//         productName: body.productName,
//         productCode: body.productCode,
//         targetQuantity: body.targetQuantity,
//         deadline: new Date(body.deadline),
//         assignedSupervisorId: body.assignedSupervisorId,
//         createdByManagerId: managerId,
//         bomItems: body.bomItems?.length
//           ? { create: body.bomItems.map((item) => ({ ...item })) }
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
//         stages: {
//           include: {
//             reviewedBy: { select: { id: true, username: true, email: true } },
//           },
//         },
//         assignedSupervisor: {
//           select: { id: true, username: true, email: true },
//         },
//         createdByManager: { select: { id: true, username: true, email: true } },
//       },
//     });
//   }

//   async updateOrder(id: string, body: UpdateProductionOrderDto) {
//     return this.prisma.productionOrder.update({
//       where: { id },
//       data: {
//         productName: body.productName,
//         productCode: body.productCode,
//         targetQuantity: body.targetQuantity,
//         deadline: body.deadline ? new Date(body.deadline) : undefined,
//         assignedSupervisorId: body.assignedSupervisorId,
//         status: body.status,
//       },
//     });
//   }

//   async cancelOrder(id: string) {
//     const order = await this.prisma.productionOrder.findUnique({
//       where: { id },
//       select: { id: true },
//     });

//     if (!order) {
//       throw new NotFoundException('Production order not found');
//     }

//     return this.prisma.$transaction(async (tx) => {
//       await tx.productionStage.updateMany({
//         where: { productionOrderId: id },
//         data: { status: ProductionStageStatus.QA_REJECTED },
//       });

//       return tx.productionOrder.update({
//         where: { id },
//         data: {
//           status: ProductionOrderStatus.CANCELLED,
//           currentStage: null,
//         },
//       });
//     });
//   }

//   async assignSupervisor(orderId: string, supervisorId: string) {
//     return this.prisma.productionOrder.update({
//       where: { id: orderId },
//       data: { assignedSupervisorId: supervisorId },
//     });
//   }

//   async listOrders(user: any) {
//     if (
//       // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
//       user.roles.includes('PRODUCTION_MANAGER') ||
//       // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
//       user.roles.includes('ADMIN') ||
//       // Allow QA roles to list orders for QA dashboard
//       // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
//       user.roles.includes('QA_MANAGER') ||
//       // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
//       user.roles.includes('QA_STAFF')
//     ) {
//       return this.listAllOrders();
//     }

//     // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
//     if (user.roles.includes('PRODUCTION_SUPERVISOR')) {
//       return this.prisma.productionOrder.findMany({
//         // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
//         where: { assignedSupervisorId: user.userId },
//         include: {
//           bomItems: { include: { material: true } },
//           stages: {
//             orderBy: { stageOrder: 'asc' },
//             include: {
//               completedBy: { select: { id: true, username: true, email: true } },
//               reviewedBy: { select: { id: true, username: true, email: true } },
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

//   async getOrderById(id: string) {
//     const order = await this.prisma.productionOrder.findUnique({
//       where: { id },
//       include: {
//         bomItems: { include: { material: true } },
//         stages: {
//           orderBy: { stageOrder: 'asc' },
//           include: {
//             completedBy: { select: { id: true, username: true, email: true } },
//             reviewedBy: { select: { id: true, username: true, email: true } },
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
//     return this.withProductionSummary(this.withStageSummary(order));
//   }

//   private async listAllOrders() {
//     const orders = await this.prisma.productionOrder.findMany({
//       include: {
//         bomItems: { include: { material: true } },
//         stages: {
//           orderBy: { stageOrder: 'asc' },
//           include: {
//             completedBy: { select: { id: true, username: true, email: true } },
//             reviewedBy: { select: { id: true, username: true, email: true } },
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

//     return orders.map((order) =>
//       this.withProductionSummary(this.withStageSummary(order)),
//     );
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

//   private async notifyPackingApproved(orderId: string, stageId: string) {
//     const order = await this.prisma.productionOrder.findUnique({
//       where: { id: orderId },
//       include: {
//         assignedSupervisor: { select: { email: true, username: true } },
//         createdByManager: { select: { email: true, username: true } },
//         outputs: {
//           where: { stageId },
//           select: { goodQuantity: true, defectiveQuantity: true },
//         },
//         stages: {
//           where: { id: stageId },
//           select: {
//             stageName: true,
//             status: true,
//             reviewedAt: true,
//             reviewedBy: { select: { username: true } },
//           },
//         },
//       },
//     });

//     if (!order) return;

//     const target = order.targetQuantity;
//     const totalDefects = order.outputs.reduce(
//       (sum, output) => sum + output.defectiveQuantity,
//       0,
//     );
//     const finalGood = Math.max(0, target - totalDefects);

//     const recipients = [
//       order.assignedSupervisor?.email,
//       order.createdByManager?.email,
//     ].filter((email): email is string => Boolean(email));

//     const subject = `Packing stage approved for ${order.orderNumber}`;
//     const html = `
//       <div style="font-family: sans-serif; max-width: 640px; margin: auto;">
//         <h2>Packing stage approved</h2>
//         <p>Order <strong>${order.orderNumber}</strong> has passed QA for the packing stage.</p>
//         <ul>
//           <li>Target quantity: ${target}</li>
//           <li>Total defects deducted: ${totalDefects}</li>
//           <li>Final good output: ${finalGood}</li>
//         </ul>
//         <p>Please review the order and finish the production closeout.</p>
//       </div>
//     `;

//     await Promise.all(
//       recipients.map((email) => this.mailService.sendAlertEmail(email, subject, html)),
//     );
//   }

//   // ============= MATERIAL MANAGEMENT =============

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

//   // ============= STAGE MANAGEMENT =============

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
//       throw new BadRequestException(
//         'Only a pending or rejected stage can be resumed',
//       );
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

//   async completeStage(orderId: string, stageId: string, completedById: string) {
//     const stage = await this.validateStageOwnership(orderId, stageId);

//     if (stage.status !== ProductionStageStatus.IN_PROGRESS) {
//       throw new BadRequestException(
//         'Only an in-progress stage can be completed',
//       );
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
//           status: ProductionStageStatus.QA_PENDING,
//           completedAt: new Date(),
//           completedById,
//         },
//       });
//     });
//   }

//   // ============= QA MANAGEMENT =============

//   async qaReview(
//     orderId: string,
//     stageId: string,
//     action: 'APPROVE' | 'REJECT',
//     reviewerId: string,
//   ) {
//     await this.validateStageOwnership(orderId, stageId);

//     const status =
//       action === 'APPROVE'
//         ? ProductionStageStatus.QA_APPROVED
//         : ProductionStageStatus.QA_REJECTED;

//     return this.prisma.$transaction(async (tx) => {
//       if (status === ProductionStageStatus.QA_APPROVED) {
//         const updatedStage = await tx.productionStage.update({
//           where: { id: stageId },
//           data: {
//             status,
//             reviewedById: reviewerId,
//             reviewedAt: new Date(),
//           },
//         });

//         const nextStage = await tx.productionStage.findFirst({
//           where: {
//             productionOrderId: orderId,
//             stageOrder: { gt: updatedStage.stageOrder },
//           },
//           orderBy: { stageOrder: 'asc' },
//         });

//         if (nextStage) {
//           // Auto-start the next stage
//           await tx.productionStage.update({
//             where: { id: nextStage.id },
//             data: {
//               status: ProductionStageStatus.IN_PROGRESS,
//               startedAt: new Date(),
//             },
//           });

//           await tx.productionOrder.update({
//             where: { id: orderId },
//             data: {
//               status: ProductionOrderStatus.IN_PROGRESS,
//               currentStage: nextStage.id,
//             },
//           });
//         } else {
//           // No next stage found; check if all are approved to complete the order
//           const remaining = await tx.productionStage.count({
//             where: {
//               productionOrderId: orderId,
//               status: { not: ProductionStageStatus.QA_APPROVED },
//             },
//           });

//           if (remaining === 0) {
//             await tx.productionOrder.update({
//               where: { id: orderId },
//               data: { status: ProductionOrderStatus.COMPLETED },
//             });
//           } else {
//             await tx.productionOrder.update({
//               where: { id: orderId },
//               data: { status: ProductionOrderStatus.IN_PROGRESS },
//             });
//           }
//         }

//         if (updatedStage.stageName === ProductionStageName.PACKING) {
//           void this.notifyPackingApproved(orderId, updatedStage.id).catch((err) => {
//             console.error('Failed to notify packing approval', err);
//           });
//         }

//         return updatedStage;
//       }

//       // QA REJECTED - mark this stage and any later stages as rejected
//       const updatedStage = await tx.productionStage.update({
//         where: { id: stageId },
//         data: {
//           status: ProductionStageStatus.QA_REJECTED,
//           reviewedById: reviewerId,
//           reviewedAt: new Date(),
//           completedAt: null,
//         },
//       });

//       await tx.productionStage.updateMany({
//         where: {
//           productionOrderId: orderId,
//           stageOrder: { gt: updatedStage.stageOrder },
//         },
//         data: {
//           status: ProductionStageStatus.QA_REJECTED,
//         },
//       });

//       await tx.productionOrder.update({
//         where: { id: orderId },
//         data: {
//           status: ProductionOrderStatus.STOPPED,
//           currentStage: stageId,
//         },
//       });

//       return updatedStage;
//     });
//   }

//   // ============= OUTPUT MANAGEMENT =============

//   async recordOutput(
//     orderId: string,
//     body: RecordOutputDto,
//     supervisorId: string,
//   ) {
//     return this.prisma.$transaction(async (tx) => {
//       const output = await tx.productionOutput.create({
//         data: {
//           productionOrderId: orderId,
//           stageId: body.stageId,
//           supervisorId: supervisorId,
//           shiftDate: new Date(body.shiftDate),
//           goodQuantity: body.goodQuantity,
//           defectiveQuantity: body.defectiveQuantity ?? 0,
//           notes: body.notes,
//         },
//       });

//       await tx.productionOrder.update({
//         where: { id: orderId },
//         data: {
//           status: ProductionOrderStatus.IN_PROGRESS,
//           currentStage: body.stageId,
//         },
//       });

//       await tx.productionStage.update({
//         where: { id: body.stageId },
//         data: {
//           status: ProductionStageStatus.IN_PROGRESS,
//           startedAt: new Date(),
//         },
//       });

//       return output;
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

//   // ============= ISSUE MANAGEMENT =============

//   async reportIssue(orderId: string, body: ReportIssueDto, userId: string) {
//     const issueType = this.normalizeIssueType(body.issueType);
//     const issue = await this.prisma.productionIssue.create({
//       data: {
//         productionOrderId: orderId,
//         stageId: body.stageId,
//         reportedById: userId,
//         issueType,
//         description: body.description,
//         priority: body.priority ?? ProductionIssuePriority.NORMAL,
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

//         const subject = `CRITICAL: Production issue reported for order ${orderId}`;
//         const html = `<p>Priority: <strong>CRITICAL</strong></p>
//                       <p>Issue Type: ${body.issueType}</p>
//                       <p>Description: ${body.description}</p>
//                       <p>Order ID: ${orderId}</p>`;

//         for (const u of maintenanceUsers) {
//           if (u.email) {
//             this.mailService
//               .sendAlertEmail(u.email, subject, html)
//               .catch((e) =>
//                 console.error('Failed to notify maintenance user', u.email, e),
//               );
//           }
//         }
//       } catch (err) {
//         console.error(
//           'Error notifying maintenance team for critical issue',
//           err,
//         );
//       }
//     }

//     return issue;
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

//   async updateIssueStatus(issueId: string, status: ProductionIssueStatus) {
//     return this.prisma.productionIssue.update({
//       where: { id: issueId },
//       data: { status },
//     });
//   }

//   // ============= QUALITY MANAGEMENT =============

//   async recordInspection(
//     orderId: string,
//     stageId: string,
//     inspectorId: string,
//     body: {
//       measurements?: string;
//       defects?: number;
//       result: string;
//       notes?: string;
//       status?: string;
//     },
//   ) {
//     await this.validateStageOwnership(orderId, stageId);

//     return this.prisma.qualityInspection.create({
//       data: {
//         productionOrderId: orderId,
//         stageId,
//         inspectedById: inspectorId,
//         measurements: body.measurements,
//         defects: body.defects ?? 0,
//         result: body.result,
//         notes: body.notes,
//         status: body.status ?? 'OPEN',
//       },
//     });
//   }

//   async listInspections(orderId?: string) {
//     return this.prisma.qualityInspection.findMany({
//       where: orderId ? { productionOrderId: orderId } : undefined,
//       include: {
//         inspectedBy: { select: { id: true, username: true, email: true } },
//         stage: true,
//         productionOrder: { select: { id: true, orderNumber: true, productName: true } },
//       },
//       orderBy: { createdAt: 'desc' },
//     });
//   }

//   async getQualityThresholds() {
//     return this.prisma.qualityThreshold.findMany({
//       include: {
//         createdBy: { select: { id: true, username: true, email: true } },
//       },
//       orderBy: { stageName: 'asc' },
//     });
//   }

//   async upsertQualityThreshold(
//     stageName: ProductionStageName,
//     body: {
//       maxDefectsPerHundred: number;
//       acceptanceCriteria: string;
//       isActive?: boolean;
//     },
//     createdById: string,
//   ) {
//     return this.prisma.qualityThreshold.upsert({
//       where: { stageName },
//       update: {
//         maxDefectsPerHundred: body.maxDefectsPerHundred,
//         acceptanceCriteria: body.acceptanceCriteria,
//         isActive: body.isActive ?? true,
//         createdById,
//       },
//       create: {
//         stageName,
//         maxDefectsPerHundred: body.maxDefectsPerHundred,
//         acceptanceCriteria: body.acceptanceCriteria,
//         isActive: body.isActive ?? true,
//         createdById,
//       },
//     });
//   }

//   async getQualityDashboard() {
//     const inspections = await this.prisma.qualityInspection.findMany({
//       include: {
//         inspectedBy: { select: { id: true, username: true, email: true } },
//         stage: true,
//       },
//       orderBy: { createdAt: 'desc' },
//     });

//     const byStage = inspections.reduce(
//       (acc, item) => {
//         const key = item.stage.stageName;
//         if (!acc[key]) acc[key] = { inspections: 0, defects: 0, passes: 0, rejects: 0 };
//         acc[key].inspections += 1;
//         acc[key].defects += item.defects;
//         if (item.result.toUpperCase() === 'PASS') acc[key].passes += 1;
//         if (item.result.toUpperCase() === 'REJECT') acc[key].rejects += 1;
//         return acc;
//       },
//       {} as Record<string, { inspections: number; defects: number; passes: number; rejects: number }>,
//     );

//     const totalDefects = inspections.reduce((sum, item) => sum + item.defects, 0);
//     const totalInspections = inspections.length;

//     return {
//       totalInspections,
//       totalDefects,
//       defectRate:
//         totalInspections > 0 ? totalDefects / totalInspections : 0,
//       byStage,
//       recentInspections: inspections.slice(0, 10),
//       recommendations:
//         totalDefects > 0
//           ? [
//               'Review stages with repeated defect spikes first.',
//               'Compare defects against threshold limits and retrain where needed.',
//             ]
//           : ['Quality performance is stable. Maintain current inspection cadence.'],
//     };
//   }

//   // ============= REPORTS =============

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

//   private normalizeIssueType(issueType: string): ProductionIssueType {
//     const normalized = issueType.trim().toUpperCase();

//     if (
//       normalized === 'QUALITY_DEVIATION' ||
//       normalized === 'QUALITY_DEFECT'
//     ) {
//       return ProductionIssueType.OTHER;
//     }

//     if (
//       normalized === 'MACHINE_FAILURE' ||
//       normalized === 'MATERIAL_SHORTAGE' ||
//       normalized === 'OTHER'
//     ) {
//       switch (normalized) {
//         case 'MACHINE_FAILURE':
//           return ProductionIssueType.MACHINE_FAILURE;
//         case 'MATERIAL_SHORTAGE':
//           return ProductionIssueType.MATERIAL_SHORTAGE;
//         default:
//           return ProductionIssueType.OTHER;
//       }
//     }

//     throw new BadRequestException(`Unsupported issue type: ${issueType}`);
//   }

//   private withProductionSummary<
//     T extends {
//       targetQuantity: number;
//       outputs: Array<{ goodQuantity: number; defectiveQuantity: number }>;
//     },
//   >(order: T) {
//     const totalGoodRecorded = order.outputs.reduce(
//       (sum, output) => sum + output.goodQuantity,
//       0,
//     );
//     const totalDefectiveRecorded = order.outputs.reduce(
//       (sum, output) => sum + output.defectiveQuantity,
//       0,
//     );
//     const netGood = Math.max(0, totalGoodRecorded - totalDefectiveRecorded);

//     return {
//       ...order,
//       totalGoodRecorded,
//       totalDefectiveRecorded,
//       netGood,
//       remainingGood: Math.max(0, order.targetQuantity - totalDefectiveRecorded),
//     };
//   }

//   private withStageSummary<
//     T extends {
//       targetQuantity: number;
//       stages: Array<{
//         id: string;
//         stageOrder: number;
//         outputs: Array<{ goodQuantity: number; defectiveQuantity: number }>;
//       }>;
//       outputs: Array<{
//         stageId: string;
//         goodQuantity: number;
//         defectiveQuantity: number;
//       }>;
//     },
//   >(order: T) {
//     let carryForwardGood = order.targetQuantity;

//     const stages = order.stages.map((stage) => {
//       const inputGood = carryForwardGood;
//       const stageOutputs =
//         stage.outputs.length > 0
//           ? stage.outputs
//           : order.outputs.filter((output) => output.stageId === stage.id);

//       const stageReportedGood = stageOutputs.reduce(
//         (sum, output) => sum + output.goodQuantity,
//         0,
//       );
//       const totalDefective = stageOutputs.reduce(
//         (sum, output) => sum + output.defectiveQuantity,
//         0,
//       );
//       const stageGoodAfterDefects = Math.max(
//         0,
//         carryForwardGood - totalDefective,
//       );
//       carryForwardGood = stageGoodAfterDefects;

//       return {
//         ...stage,
//         totalGood: stageReportedGood,
//         totalDefective,
//         stageInputGood: inputGood,
//         netGood: stageGoodAfterDefects,
//         carriedForwardGood: stageGoodAfterDefects,
//       };
//     });

//     return {
//       ...order,
//       stages,
//     };
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
  ProductionStageName,
  ProductionOrderStatus,
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

  // Helper method to check if user has any of the allowed roles
  private hasAnyRole(user: any, allowedRoles: string[]): boolean {
    if (!user || !user.roles) return false;
    return allowedRoles.some((role) => user.roles.includes(role));
  }

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
        stages: {
          include: {
            reviewedBy: { select: { id: true, username: true, email: true } },
          },
        },
        assignedSupervisor: {
          select: { id: true, username: true, email: true },
        },
        createdByManager: { select: { id: true, username: true, email: true } },
      },
    });
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
    const order = await this.prisma.productionOrder.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!order) {
      throw new NotFoundException('Production order not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.productionStage.updateMany({
        where: { productionOrderId: id },
        data: { status: ProductionStageStatus.QA_REJECTED },
      });

      return tx.productionOrder.update({
        where: { id },
        data: {
          status: ProductionOrderStatus.CANCELLED,
          currentStage: null,
        },
      });
    });
  }

  async assignSupervisor(orderId: string, supervisorId: string) {
    return this.prisma.productionOrder.update({
      where: { id: orderId },
      data: { assignedSupervisorId: supervisorId },
    });
  }

  async listOrders(user: any) {
    // Updated to include MANAGER role
    if (
      this.hasAnyRole(user, [
        'PRODUCTION_MANAGER',
        'ADMIN',
        'QA_MANAGER',
        'QA_STAFF',
        'MANAGER',
      ])
    ) {
      return this.listAllOrders();
    }

    if (user.roles.includes('PRODUCTION_SUPERVISOR')) {
      return this.prisma.productionOrder.findMany({
        where: { assignedSupervisorId: user.userId },
        include: {
          bomItems: { include: { material: true } },
          stages: {
            orderBy: { stageOrder: 'asc' },
            include: {
              completedBy: {
                select: { id: true, username: true, email: true },
              },
              reviewedBy: { select: { id: true, username: true, email: true } },
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
            completedBy: { select: { id: true, username: true, email: true } },
            reviewedBy: { select: { id: true, username: true, email: true } },
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
    return this.withProductionSummary(this.withStageSummary(order));
  }

  private async listAllOrders() {
    const orders = await this.prisma.productionOrder.findMany({
      include: {
        bomItems: { include: { material: true } },
        stages: {
          orderBy: { stageOrder: 'asc' },
          include: {
            completedBy: { select: { id: true, username: true, email: true } },
            reviewedBy: { select: { id: true, username: true, email: true } },
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

    return orders.map((order) =>
      this.withProductionSummary(this.withStageSummary(order)),
    );
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
          select: {
            stageName: true,
            status: true,
            reviewedAt: true,
            reviewedBy: { select: { username: true } },
          },
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
      recipients.map((email) =>
        this.mailService.sendAlertEmail(email, subject, html),
      ),
    );
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

  async completeStage(orderId: string, stageId: string, completedById: string) {
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
          status: ProductionStageStatus.QA_PENDING,
          completedAt: new Date(),
          completedById,
        },
      });
    });
  }

  // ============= QA MANAGEMENT =============

  async qaReview(
    orderId: string,
    stageId: string,
    action: 'APPROVE' | 'REJECT',
    reviewerId: string,
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
          data: {
            status,
            reviewedById: reviewerId,
            reviewedAt: new Date(),
          },
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
          void this.notifyPackingApproved(orderId, updatedStage.id).catch(
            (err) => {
              console.error('Failed to notify packing approval', err);
            },
          );
        }

        return updatedStage;
      }

      // QA REJECTED - mark this stage and any later stages as rejected
      const updatedStage = await tx.productionStage.update({
        where: { id: stageId },
        data: {
          status: ProductionStageStatus.QA_REJECTED,
          reviewedById: reviewerId,
          reviewedAt: new Date(),
          completedAt: null,
        },
      });

      await tx.productionStage.updateMany({
        where: {
          productionOrderId: orderId,
          stageOrder: { gt: updatedStage.stageOrder },
        },
        data: {
          status: ProductionStageStatus.QA_REJECTED,
        },
      });

      await tx.productionOrder.update({
        where: { id: orderId },
        data: {
          status: ProductionOrderStatus.STOPPED,
          currentStage: stageId,
        },
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

  // ============= QUALITY MANAGEMENT =============

  async recordInspection(
    orderId: string,
    stageId: string,
    inspectorId: string,
    body: {
      measurements?: string;
      defects?: number;
      result: string;
      notes?: string;
      status?: string;
    },
  ) {
    await this.validateStageOwnership(orderId, stageId);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.prisma.qualityInspection.create({
      data: {
        productionOrderId: orderId,
        stageId,
        inspectedById: inspectorId,
        measurements: body.measurements,
        defects: body.defects ?? 0,
        result: body.result,
        notes: body.notes,
        status: body.status ?? 'OPEN',
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async listInspections(orderId?: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.prisma.qualityInspection.findMany({
      where: orderId ? { productionOrderId: orderId } : undefined,
      include: {
        inspectedBy: { select: { id: true, username: true, email: true } },
        stage: true,
        productionOrder: {
          select: { id: true, orderNumber: true, productName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getQualityThresholds() {
    return this.prisma.qualityThreshold.findMany({
      include: {
        createdBy: { select: { id: true, username: true, email: true } },
      },
      orderBy: { stageName: 'asc' },
    });
  }

  async upsertQualityThreshold(
    stageName: ProductionStageName,
    body: {
      maxDefectsPerHundred: number;
      acceptanceCriteria: string;
      isActive?: boolean;
    },
    createdById: string,
  ) {
    return this.prisma.qualityThreshold.upsert({
      where: { stageName },
      update: {
        maxDefectsPerHundred: body.maxDefectsPerHundred,
        acceptanceCriteria: body.acceptanceCriteria,
        isActive: body.isActive ?? true,
        createdById,
      },
      create: {
        stageName,
        maxDefectsPerHundred: body.maxDefectsPerHundred,
        acceptanceCriteria: body.acceptanceCriteria,
        isActive: body.isActive ?? true,
        createdById,
      },
    });
  }

  async getQualityDashboard() {
    const inspections = await this.prisma.qualityInspection.findMany({
      include: {
        inspectedBy: { select: { id: true, username: true, email: true } },
        stage: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const byStage = inspections.reduce(
      (acc, item) => {
        const key = item.stage.stageName;
        if (!acc[key])
          acc[key] = { inspections: 0, defects: 0, passes: 0, rejects: 0 };
        acc[key].inspections += 1;
        acc[key].defects += item.defects;
        if (item.result.toUpperCase() === 'PASS') acc[key].passes += 1;
        if (item.result.toUpperCase() === 'REJECT') acc[key].rejects += 1;
        return acc;
      },
      {} as Record<
        string,
        {
          inspections: number;
          defects: number;
          passes: number;
          rejects: number;
        }
      >,
    );

    const totalDefects = inspections.reduce(
      (sum, item) => sum + item.defects,
      0,
    );
    const totalInspections = inspections.length;

    return {
      totalInspections,
      totalDefects,
      defectRate: totalInspections > 0 ? totalDefects / totalInspections : 0,
      byStage,
      recentInspections: inspections.slice(0, 10),
      recommendations:
        totalDefects > 0
          ? [
              'Review stages with repeated defect spikes first.',
              'Compare defects against threshold limits and retrain where needed.',
            ]
          : [
              'Quality performance is stable. Maintain current inspection cadence.',
            ],
    };
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

  private normalizeIssueType(issueType: string): ProductionIssueType {
    const normalized = issueType.trim().toUpperCase();

    if (normalized === 'QUALITY_DEVIATION' || normalized === 'QUALITY_DEFECT') {
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

  private withStageSummary<
    T extends {
      targetQuantity: number;
      stages: Array<{
        id: string;
        stageOrder: number;
        outputs: Array<{ goodQuantity: number; defectiveQuantity: number }>;
      }>;
      outputs: Array<{
        stageId: string;
        goodQuantity: number;
        defectiveQuantity: number;
      }>;
    },
  >(order: T) {
    let carryForwardGood = order.targetQuantity;

    const stages = order.stages.map((stage) => {
      const inputGood = carryForwardGood;
      const stageOutputs =
        stage.outputs.length > 0
          ? stage.outputs
          : order.outputs.filter((output) => output.stageId === stage.id);

      const stageReportedGood = stageOutputs.reduce(
        (sum, output) => sum + output.goodQuantity,
        0,
      );
      const totalDefective = stageOutputs.reduce(
        (sum, output) => sum + output.defectiveQuantity,
        0,
      );
      const stageGoodAfterDefects = Math.max(
        0,
        carryForwardGood - totalDefective,
      );
      carryForwardGood = stageGoodAfterDefects;

      return {
        ...stage,
        totalGood: stageReportedGood,
        totalDefective,
        stageInputGood: inputGood,
        netGood: stageGoodAfterDefects,
        carriedForwardGood: stageGoodAfterDefects,
      };
    });

    return {
      ...order,
      stages,
    };
  }
}
