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
export class StageSequenceGuard implements CanActivate {
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

    const previousStages = await this.prisma.productionStage.findMany({
      where: {
        productionOrderId: id,
        stageOrder: { lt: stage.stageOrder },
      },
      orderBy: { stageOrder: 'asc' },
    });

    if (
      previousStages.some(
        (previousStage) =>
          previousStage.status !== ProductionStageStatus.QA_APPROVED,
      )
    ) {
      throw new BadRequestException(
        'Previous stages must be QA approved before progressing to this stage',
      );
    }

    return true;
  }
}
