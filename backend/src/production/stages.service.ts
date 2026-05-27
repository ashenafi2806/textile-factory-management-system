import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductionStageStatus, ProductionOrderStatus } from '@prisma/client';

@Injectable()
export class StagesService {
  constructor(private prisma: PrismaService) {}

  async assignSupervisor(stageId: string, workerProfileId: string) {
    return this.prisma.productionStage.update({
      where: { id: stageId },
      data: { assignedWorkerId: workerProfileId },
      include: {
        assignedWorker: { include: { user: { select: { username: true } } } },
      },
    });
  }

  async updateStatus(stageId: string, status: ProductionStageStatus) {
    return this.prisma.productionStage.update({
      where: { id: stageId },
      data: { status },
    });
  }

  async recordOutput(data: {
    stageId: string;
    quantity: number;
    defectCount: number;
    recordedById: string;
    notes?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const stage = await tx.productionStage.findUnique({
        where: { id: data.stageId },
        include: { productionOrder: true },
      });

      if (!stage) {
        throw new NotFoundException('Production stage not found');
      }

      const output = await tx.productionOutput.create({
        data: {
          productionOrderId: stage.productionOrderId,
          stageId: data.stageId,
          supervisorId: data.recordedById,
          shiftDate: new Date(),
          goodQuantity: data.quantity,
          defectiveQuantity: data.defectCount,
          notes: data.notes,
        },
      });

      if (stage.productionOrder?.status === ProductionOrderStatus.PLANNED) {
        await tx.productionOrder.update({
          where: { id: stage.productionOrderId },
          data: { status: ProductionOrderStatus.IN_PROGRESS },
        });
      }

      if (stage.status === ProductionStageStatus.PENDING) {
        await tx.productionStage.update({
          where: { id: data.stageId },
          data: { status: ProductionStageStatus.IN_PROGRESS },
        });
      }

      return output;
    });
  }

  async getOutputsForStage(stageId: string) {
    return this.prisma.productionOutput.findMany({
      where: { stageId },
      include: { supervisor: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
