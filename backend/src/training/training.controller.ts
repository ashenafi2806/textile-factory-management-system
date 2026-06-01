import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TrainingService } from './training.service';

@ApiTags('training')
@ApiBearerAuth('jwt')
@Controller('training')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @ApiOperation({ summary: 'List training materials' })
  @ApiResponse({ status: 200, description: 'Array of materials' })
  @Get('materials')
  @Roles('WORKER', 'SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'STOREKEEPER', 'PRODUCTION_MANAGER', 'PRODUCTION_SUPERVISOR', 'MAINTENANCE_MANAGER', 'MAINTENANCE_TECHNICIAN', 'QA_MANAGER', 'QA_STAFF', 'ADMIN')
  findAll() {
    return this.trainingService.findAll();
  }

  @ApiOperation({ summary: 'Get a training material' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Material' })
  @Get('materials/:id')
  @Roles('WORKER', 'SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'STOREKEEPER', 'PRODUCTION_MANAGER', 'PRODUCTION_SUPERVISOR', 'MAINTENANCE_MANAGER', 'MAINTENANCE_TECHNICIAN', 'QA_MANAGER', 'QA_STAFF', 'ADMIN')
  findOne(@Param('id') id: string) {
    return this.trainingService.findOne(id);
  }
}
