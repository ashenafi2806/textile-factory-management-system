import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryCategory, TransactionType } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.inventoryItem.findMany({
      include: {
        transactions: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { performedBy: { select: { username: true } } },
        },
      },
    });
  }

  async createItem(data: {
    name: string;
    sku: string;
    category: InventoryCategory;
    unit: string;
    minThreshold?: number;
    supplier?: string;
    location?: string;
  }) {
    return this.prisma.inventoryItem.create({ data });
  }

  async recordTransaction(data: {
    itemId: string;
    type: TransactionType;
    quantity: number;
    performedById: string;
    note?: string;
    referenceId?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { id: data.itemId } });
      if (!item) throw new NotFoundException('Inventory item not found');

      // Update quantity based on type
      let newQuantity = item.quantity;
      if (data.type === TransactionType.RESTOCK || data.type === TransactionType.RETURN) {
        newQuantity += data.quantity;
      } else if (data.type === TransactionType.ISSUE || data.type === TransactionType.ADJUSTMENT) {
        if (data.type === TransactionType.ISSUE && item.quantity < data.quantity) {
          throw new BadRequestException('Insufficient stock');
        }
        newQuantity -= data.quantity;
      }

      await tx.inventoryItem.update({
        where: { id: data.itemId },
        data: { quantity: newQuantity },
      });

      return tx.inventoryTransaction.create({
        data: {
          itemId: data.itemId,
          type: data.type,
          quantity: data.quantity,
          performedById: data.performedById,
          note: data.note,
          referenceId: data.referenceId,
        },
      });
    });
  }

  async getLowStockAlerts() {
    return this.prisma.inventoryItem.findMany({
      where: {
        quantity: {
          lte: this.prisma.inventoryItem.fields.minThreshold,
        },
      },
    });
  }
}
