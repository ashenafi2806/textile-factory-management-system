import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async createOrder(data: {
    orderNumber: string;
    productName: string;
    quantity: number;
    deadline: string;
    priority?: string;
  }) {
    return this.prisma.productionOrder.create({
      data: {
        orderNumber: data.orderNumber,
        productName: data.productName,
        quantity: data.quantity,
        deadline: new Date(data.deadline),
        priority: data.priority || 'NORMAL',
        stages: {
          create: [
            { name: 'Cutting', sequence: 1 },
            { name: 'Sewing', sequence: 2 },
            { name: 'Finishing', sequence: 3 },
            { name: 'Packing', sequence: 4 },
          ]
        }
      },
      include: { stages: true }
    });
  }

  async findAll() {
    return this.prisma.productionOrder.findMany({
      include: {
        stages: {
          include: { 
            assignedWorker: { 
              include: { user: { select: { username: true } } } 
            } 
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateStatus(id: string, status: OrderStatus) {
    return this.prisma.productionOrder.update({
      where: { id },
      data: { status }
    });
  }
}
