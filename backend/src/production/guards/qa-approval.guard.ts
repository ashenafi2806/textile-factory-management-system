import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductionStageStatus } from '@prisma/client';

@Injectable()
export class QAApprovalGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { id, stageId } = request.params;
    if (!id || !stageId) {
      return true;
    }

    const stage = await this.prisma.productionStage.findUnique({
      where: { id: stageId },
    });
    if (!stage || stage.productionOrderId !== id) {
      throw new NotFoundException(
        'Stage does not belong to this production order',
      );
    }

    if (stage.status !== ProductionStageStatus.QA_PENDING) {
      throw new BadRequestException(
        'Stage must be pending QA review before QA approval',
      );
    }

    return true;
  }
}
