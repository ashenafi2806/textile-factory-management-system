import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  InventoryCategory,
  TransactionType,
  ReferenceType,
} from '@prisma/client';
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
    // Validate referenceId if provided to enforce workflows:
    // - If referenceId is a requisition -> it must be APPROVED and match item/quantity
    // - If referenceId is a production order -> order must be IN_PROGRESS (started)
    // - If referenceId is a maintenance task -> there must be an APPROVED requisition referencing the task
    if (dto.referenceId) {
      const req = await this.prisma.inventoryRequisition.findUnique({
        where: { id: dto.referenceId },
      });
      if (req) {
        if (req.status !== 'APPROVED') {
          throw new BadRequestException(
            'Requisition must be approved before issuing stock for it',
          );
        }
        if (req.itemId !== dto.itemId) {
          throw new BadRequestException(
            'Issued item does not match requisition item',
          );
        }
        if (dto.quantity > req.quantityRequested) {
          throw new BadRequestException(
            'Issued quantity exceeds requisition quantity',
          );
        }
      } else {
        const order = await this.prisma.productionOrder.findUnique({
          where: { id: dto.referenceId },
        });
        if (order) {
          if (order.status === 'PLANNED' || order.status === 'CANCELLED') {
            throw new BadRequestException(
              'Production order must be started before issuing materials against it',
            );
          }
        } else {
          const task = await this.prisma.maintenanceTask.findUnique({
            where: { id: dto.referenceId },
          });
          if (task) {
            const approvedReq =
              await this.prisma.inventoryRequisition.findFirst({
                where: { referenceId: dto.referenceId, status: 'APPROVED' },
              });
            if (!approvedReq) {
              throw new BadRequestException(
                'Maintenance spare parts must be issued via an approved requisition',
              );
            }
            if (approvedReq.itemId !== dto.itemId) {
              throw new BadRequestException(
                'Issued item does not match approved requisition item for this maintenance task',
              );
            }
            if (dto.quantity > approvedReq.quantityRequested) {
              throw new BadRequestException(
                'Issued quantity exceeds approved requisition quantity',
              );
            }
          }
        }
      }
    }

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
          referenceType: dto.referenceType
            ? (dto.referenceType as unknown as ReferenceType)
            : undefined,
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

    // For ISSUE transactions, compute how much has been returned against each (sum of RETURN transactions referencing the issue id)
    const issueIds = transactions
      .filter((t) => t.type === TransactionType.ISSUE)
      .map((t) => t.id);

    let returnsMap: Record<string, number> = {};
    if (issueIds.length > 0) {
      const grouped = await this.prisma.inventoryTransaction.groupBy({
        by: ['referenceId'],
        where: {
          type: TransactionType.RETURN,
          referenceId: { in: issueIds as string[] },
        },
        _sum: { quantity: true },
      });

      grouped.forEach((g) => {
        if (g.referenceId)
          returnsMap[g.referenceId] = this.toNumber(g._sum.quantity ?? 0);
      });
    }

    // Attach returnedQuantity to the transaction objects for frontend consumption
    const enriched = transactions.map((t) => ({
      ...t,
      returnedQuantity:
        t.type === TransactionType.ISSUE ? (returnsMap[t.id] ?? 0) : undefined,
    }));

    return {
      data: enriched,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async returnStock(
    dto: {
      itemId: string;
      quantity: number;
      referenceTransactionId: string;
      note?: string;
    },
    userId: string,
  ) {
    // Validate original transaction
    const original = await this.prisma.inventoryTransaction.findUnique({
      where: { id: dto.referenceTransactionId },
    });

    if (!original) {
      throw new NotFoundException('Original transaction not found');
    }

    if (original.type !== TransactionType.ISSUE) {
      throw new BadRequestException(
        'Can only return against an ISSUE transaction',
      );
    }

    // Compute already returned for this issue
    const returnedAgg = await this.prisma.inventoryTransaction.aggregate({
      _sum: { quantity: true },
      where: {
        type: TransactionType.RETURN,
        referenceId: dto.referenceTransactionId,
      },
    });

    const alreadyReturned = this.toNumber(returnedAgg._sum.quantity ?? 0);
    const allowed = this.toNumber(original.quantity) - alreadyReturned;

    if (dto.quantity > allowed) {
      throw new BadRequestException(
        `Return quantity exceeds remaining issued amount (${allowed})`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({
        where: { id: dto.itemId },
      });
      if (!item) throw new NotFoundException('Inventory item not found');

      const updated = await tx.inventoryItem.update({
        where: { id: dto.itemId },
        data: { quantity: { increment: dto.quantity } },
      });

      const transaction = await tx.inventoryTransaction.create({
        data: {
          itemId: dto.itemId,
          type: TransactionType.RETURN,
          quantity: dto.quantity,
          performedById: userId,
          referenceId: dto.referenceTransactionId,
          // preserve original referenceType if available, else mark OTHER
          referenceType: original.referenceType ?? undefined,
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

  /**
   * Inventory valuation report.
   * For each item compute an estimated unit cost (weighted average of receipt unitPrice)
   * and total value = current quantity * avgUnitPrice.
   */
  async getValuation() {
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        sku: string;
        category: InventoryCategory;
        quantity: number | bigint | string;
        avgUnitPrice: number | bigint | string | null;
        totalValue: number | bigint | string | null;
      }>
    >`
      SELECT ii.id, ii.name, ii.sku, ii.category, ii.quantity,
        COALESCE(SUM(ri.unitPrice * ri.quantity) / NULLIF(SUM(ri.quantity),0), 0) AS avgUnitPrice,
        (ii.quantity * COALESCE(SUM(ri.unitPrice * ri.quantity) / NULLIF(SUM(ri.quantity),0), 0)) AS totalValue
      FROM InventoryItem ii
      LEFT JOIN InventoryReceiptItem ri ON ri.itemId = ii.id
      GROUP BY ii.id
      ORDER BY totalValue DESC
    `;

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      sku: r.sku,
      category: r.category,
      quantity: this.toNumber(r.quantity),
      avgUnitPrice: r.avgUnitPrice ? this.toNumber(r.avgUnitPrice) : 0,
      totalValue: r.totalValue ? this.toNumber(r.totalValue) : 0,
    }));
  }

  /**
   * Aging report - weighted average age (days) of received stock for each item.
   * If there are no receipt records, fall back to days since the item was last updated.
   */
  async getAgingReport() {
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        sku: string;
        quantity: number | bigint | string;
        weightedAverageAgeDays: number | bigint | string | null;
      }>
    >`
      SELECT ii.id, ii.name, ii.sku, ii.quantity,
        CASE WHEN SUM(ri.quantity) IS NULL OR SUM(ri.quantity) = 0
          THEN DATEDIFF(NOW(), ii.updatedAt)
          ELSE (SUM(DATEDIFF(NOW(), r.purchaseDate) * ri.quantity) / SUM(ri.quantity))
        END AS weightedAverageAgeDays
      FROM InventoryItem ii
      LEFT JOIN InventoryReceiptItem ri ON ri.itemId = ii.id
      LEFT JOIN InventoryReceipt r ON ri.receiptId = r.id
      GROUP BY ii.id
      ORDER BY weightedAverageAgeDays DESC
    `;

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      sku: r.sku,
      quantity: this.toNumber(r.quantity),
      weightedAverageAgeDays: r.weightedAverageAgeDays
        ? this.toNumber(r.weightedAverageAgeDays)
        : 0,
    }));
  }

  /**
   * Consumption analysis - total issued quantity and average daily consumption
   * for the given period (days). Default 30 days.
   */
  async getConsumptionAnalysis(days = 30) {
    const rows = await this.prisma.$queryRaw<
      Array<{
        itemId: string;
        name: string;
        sku: string;
        issued: number | bigint | string | null;
      }>
    >`
      SELECT it.itemId as itemId, ii.name, ii.sku, COALESCE(SUM(it.quantity),0) as issued
      FROM InventoryTransaction it
      JOIN InventoryItem ii ON ii.id = it.itemId
      WHERE it.type = 'ISSUE' AND it.createdAt >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
      GROUP BY it.itemId
      ORDER BY issued DESC
    `;

    return rows.map((r) => ({
      itemId: r.itemId,
      name: r.name,
      sku: r.sku,
      issued: r.issued ? this.toNumber(r.issued) : 0,
      dailyRate: r.issued ? this.toNumber(r.issued) / days : 0,
    }));
  }
}
