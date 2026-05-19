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
    const request: { params?: Record<string, string> } = context
      .switchToHttp()
      .getRequest();
    const orderId = request.params?.id;
    if (!orderId) {
      return true;
    }

    const order = (await this.prisma.productionOrder.findUnique({
      where: { id: orderId },
      include: {
        bomItems: { include: { material: true } },
      },
    })) as unknown as {
      bomItems: Array<{
        material: { quantity: number } | null;
        requiredQuantity: number;
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
        'Material availability check failed: insufficient inventory for BOM items',
      );
    }

    return true;
  }
}
