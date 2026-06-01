import {
  Controller,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
  Get,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { StagesService } from './stages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ProductionStageStatus } from '@prisma/client';

@ApiTags('production-stages')
@ApiBearerAuth('jwt')
@Controller('production/stages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StagesController {
  constructor(private stagesService: StagesService) {}

  @ApiOperation({ summary: 'Assign a supervisor to a stage' })
  @ApiParam({ name: 'id' })
  @ApiBody({ schema: { type: 'object', properties: { workerProfileId: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Assigned' })
  @Put(':id/assign')
  @Roles('PRODUCTION_MANAGER', 'MANAGER', 'ADMIN')
  assignSupervisor(
    @Param('id') id: string,
    @Body('workerProfileId') workerProfileId: string,
  ) {
    return this.stagesService.assignSupervisor(id, workerProfileId);
  }

  @ApiOperation({ summary: 'Update stage status' })
  @ApiParam({ name: 'id' })
  @ApiBody({ schema: { type: 'object', properties: { status: { enum: Object.values(ProductionStageStatus) } } } })
  @ApiResponse({ status: 200, description: 'Updated' })
  @Put(':id/status')
  @Roles('PRODUCTION_MANAGER', 'PRODUCTION_SUPERVISOR', 'ADMIN')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: ProductionStageStatus,
  ) {
    return this.stagesService.updateStatus(id, status);
  }

  @ApiOperation({ summary: 'Record stage output' })
  @ApiParam({ name: 'id' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['quantity'],
      properties: {
        quantity: { type: 'integer' },
        defectCount: { type: 'integer' },
        notes: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Recorded' })
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

  @ApiOperation({ summary: 'List output entries for a stage' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Output entries' })
  @Get(':id/output')
  @Roles('PRODUCTION_MANAGER', 'PRODUCTION_SUPERVISOR', 'MANAGER', 'ADMIN')
  getOutputs(@Param('id') id: string) {
    return this.stagesService.getOutputsForStage(id);
  }
}
