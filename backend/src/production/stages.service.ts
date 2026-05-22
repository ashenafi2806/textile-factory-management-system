import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StageStatus } from '@prisma/client';

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

  async updateStatus(stageId: string, status: StageStatus) {
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
      const output = await tx.productionOutput.create({
        data: {
          stageId: data.stageId,
          quantity: data.quantity,
          defectCount: data.defectCount,
          recordedById: data.recordedById,
          notes: data.notes,
        },
      });

      const stage = await tx.productionStage.findUnique({
        where: { id: data.stageId },
        include: { order: true },
      });

      if (stage && stage.order.status === 'PENDING') {
        await tx.productionOrder.update({
          where: { id: stage.orderId },
          data: { status: 'IN_PRODUCTION' },
        });
      }

      if (stage && stage.status === 'NOT_STARTED') {
        await tx.productionStage.update({
          where: { id: data.stageId },
          data: { status: 'IN_PROGRESS' },
        });
      }

      return output;
    });
  }

  async getOutputsForStage(stageId: string) {
    return this.prisma.productionOutput.findMany({
      where: { stageId },
      include: { recordedBy: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
