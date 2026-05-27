import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductionOrderStatus, ProductionStageName } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async createOrder(data: {
    orderNumber: string;
    productName: string;
    productCode: string;
    quantity: number;
    deadline: string;
    createdByManagerId: string;
  }) {
    return this.prisma.productionOrder.create({
      data: {
        orderNumber: data.orderNumber,
        productName: data.productName,
        productCode: data.productCode,
        targetQuantity: data.quantity,
        deadline: new Date(data.deadline),
        createdByManagerId: data.createdByManagerId,
        stages: {
          create: [
            { stageName: ProductionStageName.CUTTING, stageOrder: 1 },
            { stageName: ProductionStageName.SEWING, stageOrder: 2 },
            { stageName: ProductionStageName.FINISHING, stageOrder: 3 },
            { stageName: ProductionStageName.PACKING, stageOrder: 4 },
          ],
        },
      },
      include: { stages: true },
    });
  }

  async findAll() {
    return this.prisma.productionOrder.findMany({
      include: {
        stages: {
          include: {
            assignedWorker: {
              include: { user: { select: { username: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: ProductionOrderStatus) {
    return this.prisma.productionOrder.update({
      where: { id },
      data: { status },
    });
  }
}
