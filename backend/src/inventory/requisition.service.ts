import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateRequisitionDto } from './dto/create-requisition.dto';
import { TransactionType, ReferenceType } from '@prisma/client';

@Injectable()
export class RequisitionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private get client() {
    return this.prisma as any;
  }

  private async getItemOrThrow(itemId: string) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id: itemId },
    });
    if (!item) throw new NotFoundException('Inventory item not found');
    return item;
  }

  async create(dto: CreateRequisitionDto, userId: string) {
    const item = await this.getItemOrThrow(dto.itemId);
    const available = item.quantity;

    if (dto.quantityRequested <= 0) {
      throw new BadRequestException(
        'Requested quantity must be greater than zero',
      );
    }

    const requisition = await this.client.inventoryRequisition.create({
      data: {
        requestedById: userId,
        itemId: dto.itemId,
        quantityRequested: dto.quantityRequested,
        purpose: dto.purpose,
        referenceId: dto.referenceId,
      },
      include: {
        item: true,
        requestedBy: { select: { id: true, username: true, email: true } },
      },
    });

    if (available < dto.quantityRequested) {
      // Notify the requester that the material is currently unavailable so
      // they can plan around the shortage. This is a non-fatal warning.
      await this.notificationsService.createForUsers([userId], {
        title: 'Material unavailable',
        message: `Only ${available} ${item.unit} of ${item.name} is in stock; your requisition requested ${dto.quantityRequested}. Stock has been requested from procurement.`,
        type: 'MATERIAL_SHORTAGE',
        urgent: true,
      });
    }

    return {
      ...requisition,
      availability: {
        available,
        requested: dto.quantityRequested,
        shortBy: Math.max(0, dto.quantityRequested - available),
        canFulfill: available >= dto.quantityRequested,
      },
    };
  }

  async findAll(user: { id: string; roles: string[] }) {
    const isManager =
      user.roles.includes('MANAGER') || user.roles.includes('ADMIN');
    const where = isManager ? {} : { requestedById: user.id };
    return this.client.inventoryRequisition.findMany({
      where,
      include: {
        item: true,
        requestedBy: { select: { id: true, username: true, email: true } },
        approvedBy: { select: { id: true, username: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(id: string, managerId: string) {
    const requisition = await this.client.inventoryRequisition.findUnique({
      where: { id },
      include: { item: true },
    });
    if (!requisition) throw new NotFoundException('Requisition not found');
    if (requisition.status !== 'PENDING') {
      throw new BadRequestException(
        'Only pending requisitions can be approved',
      );
    }

    if (requisition.item.quantity < requisition.quantityRequested) {
      throw new BadRequestException(
        `Insufficient stock: ${requisition.item.quantity} ${requisition.item.unit} available, ${requisition.quantityRequested} requested`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const client = tx as any;
      await client.inventoryItem.update({
        where: { id: requisition.itemId },
        data: { quantity: { decrement: requisition.quantityRequested } },
      });

      const requisitionAfter = await client.inventoryRequisition.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedById: managerId,
          approvedAt: new Date(),
        },
        include: {
          item: true,
          requestedBy: { select: { id: true, username: true, email: true } },
          approvedBy: { select: { id: true, username: true, email: true } },
        },
      });

      await client.inventoryTransaction.create({
        data: {
          itemId: requisition.itemId,
          type: TransactionType.ISSUE,
          quantity: requisition.quantityRequested,
          performedById: managerId,
          referenceId: requisition.id,
          referenceType: ReferenceType.REQUISITION,
          note: requisition.purpose,
        },
      });

      return requisitionAfter;
    });

    await this.notificationsService.createForUsers(
      [requisition.requestedById],
      {
        title: 'Material requisition approved',
        message: `Your request for ${updated.quantityRequested} ${updated.item.unit} of ${updated.item.name} has been approved and issued to your work area.`,
        type: 'REQUISITION_APPROVED',
        urgent: false,
      },
    );

    return updated;
  }

  async reject(id: string, managerId: string, reason: string) {
    const requisition = await this.client.inventoryRequisition.findUnique({
      where: { id },
    });
    if (!requisition) throw new NotFoundException('Requisition not found');

    const updated = await this.client.inventoryRequisition.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedById: managerId,
        approvedAt: new Date(),
        rejectedReason: reason,
      },
      include: {
        item: true,
        requestedBy: { select: { id: true, username: true, email: true } },
        approvedBy: { select: { id: true, username: true, email: true } },
      },
    });

    await this.notificationsService.createForUsers(
      [requisition.requestedById],
      {
        title: 'Material requisition rejected',
        message: `Your request for ${updated.quantityRequested} ${updated.item.unit} of ${updated.item.name} was rejected. Reason: ${reason}`,
        type: 'REQUISITION_REJECTED',
        urgent: true,
      },
    );

    return updated;
  }
}
