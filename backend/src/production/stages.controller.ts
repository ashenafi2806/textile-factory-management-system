import {
  Controller,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
  Get,
} from '@nestjs/common';
import { StagesService } from './stages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ProductionStageStatus } from '@prisma/client';

@Controller('production/stages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StagesController {
  constructor(private stagesService: StagesService) {}

  @Put(':id/assign')
  @Roles('PRODUCTION_MANAGER', 'MANAGER', 'ADMIN')
  assignSupervisor(
    @Param('id') id: string,
    @Body('workerProfileId') workerProfileId: string,
  ) {
    return this.stagesService.assignSupervisor(id, workerProfileId);
  }

  @Put(':id/status')
  @Roles('PRODUCTION_MANAGER', 'PRODUCTION_SUPERVISOR', 'ADMIN')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: ProductionStageStatus,
  ) {
    return this.stagesService.updateStatus(id, status);
  }

  @Post(':id/output')
  @Roles('PRODUCTION_SUPERVISOR', 'ADMIN')
  recordOutput(
    @Param('id') id: string,
    @Body() data: any,
    @CurrentUser() user: any,
  ) {
    return this.stagesService.recordOutput({
      stageId: id,
      quantity: data.quantity,
      defectCount: data.defectCount || 0,
      recordedById: user.id,
      notes: data.notes,
    });
  }

  @Get(':id/output')
  @Roles('PRODUCTION_MANAGER', 'PRODUCTION_SUPERVISOR', 'MANAGER', 'ADMIN')
  getOutputs(@Param('id') id: string) {
    return this.stagesService.getOutputsForStage(id);
  }
}
