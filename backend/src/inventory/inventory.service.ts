import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, InventoryCategory, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { RestockItemDto } from './dto/restock-item.dto';
import { IssueStockDto } from './dto/issue-stock.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';

type InventoryItemRecord = {
  id: string;
  name: string;
  sku: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  minThreshold: number;
  supplier: string | null;
  location: string | null;
};

type InventoryItemWithCount = InventoryItemRecord & {
  _count: {
    transactions: number;
  };
};

type InventoryTransactionRecord = {
  id: string;
  type: TransactionType;
  quantity: number;
  referenceId: string | null;
  createdAt: Date;
};

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  private toNumber(value: number | bigint | string): number {
    return typeof value === 'bigint' ? Number(value) : Number(value);
  }

  private mapItem(item: InventoryItemRecord) {
    return {
      ...item,
      isLowStock: item.quantity <= item.minThreshold,
    };
  }

  private mapItemWithCount(item: InventoryItemWithCount) {
    return {
      ...this.mapItem(item),
      _count: item._count,
    };
  }

  private mapTransaction(transaction: InventoryTransactionRecord) {
    return {
      id: transaction.id,
      type: transaction.type,
      quantity: transaction.quantity,
      referenceId: transaction.referenceId,
      createdAt: transaction.createdAt,
    };
  }

  async createItem(dto: CreateInventoryItemDto) {
    const existingItem = await this.prisma.inventoryItem.findUnique({
      where: { sku: dto.sku },
    });

    if (existingItem) {
      throw new ConflictException(
        'Inventory item with this SKU already exists',
      );
    }

    const item = await this.prisma.inventoryItem.create({
      data: {
        name: dto.name,
        sku: dto.sku,
        category: dto.category,
        unit: dto.unit,
        minThreshold: dto.minThreshold,
        supplier: dto.supplier,
        location: dto.location,
      },
    });

    return this.mapItem(item);
  }

  async findAll(params: {
    category?: InventoryCategory;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 20;
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryItemWhereInput = {};

    if (params.category) {
      where.category = params.category;
    }

    if (params.search?.trim()) {
      where.OR = [
        { name: { contains: params.search.trim() } },
        { sku: { contains: params.search.trim() } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.inventoryItem.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);

    return {
      data: items.map((item) => this.mapItem(item)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    return this.mapItemWithCount(item as InventoryItemWithCount);
  }

  async updateItem(id: string, dto: UpdateInventoryItemDto) {
    const existingItem = await this.prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      throw new NotFoundException('Inventory item not found');
    }

    if (dto.sku) {
      const skuExists = await this.prisma.inventoryItem.findFirst({
        where: {
          sku: dto.sku,
          NOT: { id },
        },
      });

      if (skuExists) {
        throw new ConflictException(
          'Inventory item with this SKU already exists',
        );
      }
    }

    const item = await this.prisma.inventoryItem.update({
      where: { id },
      data: dto,
    });

    return this.mapItem(item);
  }

  async addStock(dto: RestockItemDto, userId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({
        where: { id: dto.itemId },
      });

      if (!item) {
        throw new NotFoundException('Inventory item not found');
      }

      const updated = await tx.inventoryItem.update({
        where: { id: dto.itemId },
        data: { quantity: { increment: dto.quantity } },
      });

      const transaction = await tx.inventoryTransaction.create({
        data: {
          itemId: dto.itemId,
          type: TransactionType.RESTOCK,
          quantity: dto.quantity,
          performedById: userId,
          note: dto.note,
        },
      });

      return { updated, transaction };
    });

    return {
      item: this.mapItem(result.updated),
      transaction: this.mapTransaction(result.transaction),
    };
  }

  async issueStock(dto: IssueStockDto, userId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({
        where: { id: dto.itemId },
      });

      if (!item) {
        throw new NotFoundException('Inventory item not found');
      }

      if (item.quantity < dto.quantity) {
        throw new BadRequestException(
          `Insufficient stock: ${item.quantity} ${item.unit} available, ${dto.quantity} requested`,
        );
      }

      const updated = await tx.inventoryItem.update({
        where: { id: dto.itemId },
        data: { quantity: { decrement: dto.quantity } },
      });

      const transaction = await tx.inventoryTransaction.create({
        data: {
          itemId: dto.itemId,
          type: TransactionType.ISSUE,
          quantity: dto.quantity,
          performedById: userId,
          referenceId: dto.referenceId,
          note: dto.note,
        },
      });

      return { updated, transaction };
    });

    if (result.updated.quantity <= result.updated.minThreshold) {
      console.warn(
        `Low stock alert for item ${result.updated.name} (${result.updated.sku})`,
      );
    }

    return {
      item: this.mapItem(result.updated),
      transaction: this.mapTransaction(result.transaction),
      alert:
        result.updated.quantity <= result.updated.minThreshold
          ? 'LOW_STOCK'
          : null,
    };
  }

  async adjustStock(dto: AdjustStockDto, userId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({
        where: { id: dto.itemId },
      });

      if (!item) {
        throw new NotFoundException('Inventory item not found');
      }

      const newQuantity = item.quantity + dto.quantity;

      if (newQuantity < 0) {
        throw new BadRequestException('Adjustment results in negative stock');
      }

      const updated = await tx.inventoryItem.update({
        where: { id: dto.itemId },
        data: { quantity: newQuantity },
      });

      const transaction = await tx.inventoryTransaction.create({
        data: {
          itemId: dto.itemId,
          type: TransactionType.ADJUSTMENT,
          quantity: dto.quantity,
          performedById: userId,
          note: dto.note,
        },
      });

      return { item, updated, transaction };
    });

    return {
      item: this.mapItem(result.updated),
      transaction: this.mapTransaction(result.transaction),
      previousQuantity: result.item.quantity,
    };
  }

  async getAlerts() {
    const alerts = await this.prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        sku: string;
        category: InventoryCategory;
        quantity: number | bigint | string;
        unit: string;
        minThreshold: number | bigint | string;
        supplier: string | null;
        location: string | null;
      }>
    >`
      SELECT id, name, sku, category, quantity, unit, minThreshold, supplier, location
      FROM InventoryItem
      WHERE quantity <= minThreshold
      ORDER BY (quantity / minThreshold) ASC
    `;

    const normalizedAlerts = alerts.map((alert) => {
      const quantity = this.toNumber(alert.quantity);
      const minThreshold = this.toNumber(alert.minThreshold);

      return {
        ...alert,
        quantity,
        minThreshold,
        shortage: minThreshold - quantity,
        severity: quantity === 0 ? 'critical' : 'warning',
      };
    });

    return {
      count: normalizedAlerts.length,
      alerts: normalizedAlerts,
    };
  }

  async getTransactions(params: {
    itemId?: string;
    type?: TransactionType;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 20;
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryTransactionWhereInput = {};

    if (params.itemId) {
      where.itemId = params.itemId;
    }

    if (params.type) {
      where.type = params.type;
    }

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        where.createdAt.gte = params.startDate;
      }
      if (params.endDate) {
        where.createdAt.lte = params.endDate;
      }
    }

    const [transactions, total] = await this.prisma.$transaction([
      this.prisma.inventoryTransaction.findMany({
        where,
        include: {
          item: { select: { name: true, sku: true, unit: true } },
          performedBy: { select: { username: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.inventoryTransaction.count({ where }),
    ]);

    return {
      data: transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSummary() {
    const summary = await this.prisma.inventoryItem.groupBy({
      by: ['category'],
      _sum: { quantity: true },
      _count: { id: true },
    });

    return summary.map((row) => ({
      category: row.category,
      totalItems: row._count.id,
      totalQuantity: row._sum.quantity ?? 0,
    }));
  }
}
