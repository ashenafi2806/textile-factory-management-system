import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryReceiptDto } from './dto/create-inventory-receipt.dto';
import { TransactionType, ReferenceType } from '@prisma/client';

@Injectable()
export class ReceiptService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInventoryReceiptDto, userId: string) {
    // Create receipt and items, and update stock + create transactions in a single transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const receipt = await tx.inventoryReceipt.create({
        data: {
          supplierName: dto.supplierName,
          batchNumber: dto.batchNumber,
          purchaseDate: new Date(dto.purchaseDate),
          createdById: userId,
        },
      });

      const createdItems: any[] = [];

      for (const it of dto.items) {
        const item = await tx.inventoryItem.findUnique({
          where: { id: it.itemId },
        });
        if (!item) {
          throw new NotFoundException(`Inventory item not found: ${it.itemId}`);
        }

        const receiptItem = await tx.inventoryReceiptItem.create({
          data: {
            receiptId: receipt.id,
            itemId: it.itemId,
            quantity: it.quantity,
            unitPrice: it.unitPrice ?? undefined,
          },
        });

        // update stock
        const updated = await tx.inventoryItem.update({
          where: { id: it.itemId },
          data: { quantity: { increment: it.quantity } },
        });

        // create transaction
        await tx.inventoryTransaction.create({
          data: {
            itemId: it.itemId,
            type: TransactionType.RESTOCK,
            quantity: it.quantity,
            performedById: userId,
            referenceId: receipt.id,
            referenceType: ReferenceType.RECEIPT,
            note: `Receipt ${receipt.id} supplier:${dto.supplierName} batch:${dto.batchNumber ?? ''}`,
          },
        });

        createdItems.push({ receiptItem, updated });
      }

      return { receipt, items: createdItems };
    });

    return result;
  }

  async findAll(params?: { startDate?: string; endDate?: string }) {
    const where: any = {};

    if (params?.startDate || params?.endDate) {
      where.purchaseDate = {};
      if (params.startDate) where.purchaseDate.gte = new Date(params.startDate);
      if (params.endDate) where.purchaseDate.lte = new Date(params.endDate);
    }

    const receipts = await this.prisma.inventoryReceipt.findMany({
      where,
      include: {
        items: { include: { item: true } },
        createdBy: { select: { id: true, username: true, email: true } },
      },
      orderBy: { purchaseDate: 'desc' },
    });

    return receipts;
  }
}
