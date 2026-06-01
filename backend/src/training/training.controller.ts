import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TrainingService } from './training.service';

@Controller('training')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Get('materials')
  @Roles('WORKER', 'SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'STOREKEEPER', 'PRODUCTION_MANAGER', 'PRODUCTION_SUPERVISOR', 'MAINTENANCE_MANAGER', 'MAINTENANCE_TECHNICIAN', 'QA_MANAGER', 'QA_STAFF', 'ADMIN')
  findAll() {
    return this.trainingService.findAll();
  }

  @Get('materials/:id')
  @Roles('WORKER', 'SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'STOREKEEPER', 'PRODUCTION_MANAGER', 'PRODUCTION_SUPERVISOR', 'MAINTENANCE_MANAGER', 'MAINTENANCE_TECHNICIAN', 'QA_MANAGER', 'QA_STAFF', 'ADMIN')
  findOne(@Param('id') id: string) {
    return this.trainingService.findOne(id);
  }
}
