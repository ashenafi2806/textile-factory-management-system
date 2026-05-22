import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('workforce/shifts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShiftsController {
  constructor(private shiftsService: ShiftsService) {}

  @Post()
  @Roles('HR_ADMIN', 'ADMIN')
  create(@Body() data: any) {
    return this.shiftsService.createShift(data);
  }

  @Get()
  @Roles('HR_ADMIN', 'ADMIN', 'SUPERVISOR')
  findAll() {
    return this.shiftsService.findAll();
  }

  @Get('worker/:id')
  @Roles('SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'ADMIN')
  getWorkerShift(
    @Param('id') workerId: string,
    @Query('date') dateStr: string,
  ) {
    const date = dateStr ? new Date(dateStr) : new Date();
    return this.shiftsService.getShiftForDate(workerId, date);
  }

  @Get('worker/:id/schedule')
  @Roles('SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'ADMIN')
  getWorkerSchedule(
    @Param('id') workerId: string,
    @Query('start') startStr: string,
    @Query('end') endStr: string,
  ) {
    const start = new Date(startStr);
    const end = new Date(endStr);
    return this.shiftsService.generateScheduleForRange(workerId, start, end);
  }
}
