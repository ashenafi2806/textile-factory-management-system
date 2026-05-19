import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AssignedOrderGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: {
      user?: { userId?: string; roles?: string[] };
      params?: Record<string, string>;
    } = context.switchToHttp().getRequest();
    const user = request.user;
    const params = request.params;
    if (!user || !Array.isArray(user.roles)) {
      return false;
    }

    if (!user.roles.includes('PRODUCTION_SUPERVISOR')) {
      return true;
    }

    const orderId = params?.id ?? params?.productionOrderId;
    if (!orderId) {
      return true;
    }

    const order = (await this.prisma.productionOrder.findUnique({
      where: { id: orderId },
    })) as unknown as { assignedSupervisorId?: string } | null;
    if (!order) {
      throw new NotFoundException('Production order not found');
    }

    if (order.assignedSupervisorId !== user.userId) {
      throw new ForbiddenException(
        'Supervisor can only access their assigned production orders',
      );
    }

    return true;
  }
}
