import { Injectable } from '@nestjs/common';
import { ProductionService } from './production.service';
import { ProductionOrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private readonly productionService: ProductionService) {}

  async createOrder(data: {
    orderNumber: string;
    productName: string;
    productCode: string;
    quantity: number;
    deadline: string;
    createdByManagerId: string;
  }) {
    return this.productionService.createOrder(
      {
        productName: data.productName,
        productCode: data.productCode,
        targetQuantity: data.quantity,
        deadline: data.deadline,
        bomItems: [],
      },
      data.createdByManagerId,
    );
  }

  async findAll(user: { userId: string; roles: string[] } = { userId: '', roles: [] }) {
    return this.productionService.listOrders(user);
  }

  async updateStatus(id: string, status: ProductionOrderStatus) {
    return this.productionService.updateOrder(id, { status });
  }
}
