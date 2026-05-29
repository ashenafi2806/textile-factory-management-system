import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MaterialAvailabilityGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: { params?: Record<string, string>; body?: any } = context
      .switchToHttp()
      .getRequest();
    const orderId = request.params?.id;
    if (!orderId) {
      const bomItems = Array.isArray(request.body?.bomItems)
        ? request.body.bomItems
        : [];
      if (bomItems.length === 0) {
        return true;
      }

      const materialIds = bomItems.map((item: { materialId: string }) => item.materialId);
      const materials = await this.prisma.inventoryItem.findMany({
        where: { id: { in: materialIds } },
      });
      const missingItems = bomItems
        .map((bom: { materialId: string; requiredQuantity: number; unit?: string }) => {
          const material = materials.find((item) => item.id === bom.materialId);
          return {
            materialId: bom.materialId,
            name: material?.name ?? 'Unknown material',
            requiredQuantity: bom.requiredQuantity,
            availableQuantity: material?.quantity ?? 0,
            unit: bom.unit ?? material?.unit ?? '',
          };
        })
        .filter((item) => item.availableQuantity < item.requiredQuantity);

      if (missingItems.length > 0) {
        throw new BadRequestException(
          `Insufficient materials: ${missingItems
            .map((item) => `${item.name} (${item.availableQuantity}/${item.requiredQuantity} ${item.unit})`)
            .join(', ')}`,
        );
      }

      return true;
    }

    const order = (await this.prisma.productionOrder.findUnique({
      where: { id: orderId },
      include: {
        bomItems: {
          include: {
            material: true,
          },
        },
      },
    })) as unknown as {
      bomItems: Array<{
        material: { name: string; quantity: number; unit: string } | null;
        requiredQuantity: number;
        unit: string;
      }>;
    } | null;
    if (!order) {
      throw new NotFoundException('Production order not found');
    }

    const missingItems = order.bomItems.filter(
      (bom) => !bom.material || bom.material.quantity < bom.requiredQuantity,
    );
    if (missingItems.length > 0) {
      throw new BadRequestException(
        `Insufficient materials: ${missingItems
          .map((item) => `${item.material?.name ?? 'Unknown material'} (${item.material?.quantity ?? 0}/${item.requiredQuantity} ${item.unit})`)
          .join(', ')}`,
      );
    }

    return true;
  }
}
