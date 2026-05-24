/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Put,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('workforce/shifts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShiftsController {
  constructor(
    private shiftsService: ShiftsService,
    private prisma: PrismaService,
  ) {}

  @Post()
  @Roles('HR_ADMIN', 'ADMIN')
  create(@Body() data: any) {
    return this.shiftsService.createShift(data);
  }

  @Get()
  @Roles('HR_ADMIN', 'ADMIN', 'SUPERVISOR', 'MANAGER')
  findAll() {
    return this.shiftsService.findAll();
  }

  @Get('worker/:id')
  @Roles('SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'ADMIN', 'WORKER')
  async getWorkerShift(
    @Param('id') workerId: string,
    @Query('date') dateStr: string,
    @CurrentUser() user: any,
  ) {
    // Workers can only view their own shift
    if (user.roles.includes('WORKER') && user.workerProfileId !== workerId) {
      throw new ForbiddenException('You can only view your own shift');
    }

    const date = dateStr ? new Date(dateStr) : new Date();
    return this.shiftsService.getShiftForDate(workerId, date);
  }

  @Get('worker/:id/schedule')
  @Roles('SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'ADMIN', 'WORKER')
  async getWorkerSchedule(
    @Param('id') workerId: string,
    @Query('start') startStr: string,
    @Query('end') endStr: string,
    @CurrentUser() user: any,
  ) {
    // Workers can only view their own schedule
    if (user.roles.includes('WORKER') && user.workerProfileId !== workerId) {
      throw new ForbiddenException('You can only view your own schedule');
    }

    const start = new Date(startStr);
    const end = new Date(endStr);
    return this.shiftsService.generateScheduleForRange(workerId, start, end);
  }

  @Get('worker/:id/upcoming')
  @Roles('SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'ADMIN', 'WORKER')
  async getUpcomingShifts(
    @Param('id') workerId: string,
    @Query('days') days: string,
    @CurrentUser() user: any,
  ) {
    // Workers can only view their own shifts
    if (user.roles.includes('WORKER') && user.workerProfileId !== workerId) {
      throw new ForbiddenException('You can only view your own shifts');
    }

    const daysNum = days ? parseInt(days) : 7;
    return this.shiftsService.getUpcomingShifts(workerId, daysNum);
  }

  @Get('team/:teamId/schedule')
  @Roles('SUPERVISOR', 'MANAGER', 'ADMIN')
  async getTeamSchedule(
    @Param('teamId') teamId: string,
    @Query('start') startStr: string,
    @Query('end') endStr: string,
  ) {
    const start = new Date(startStr);
    const end = new Date(endStr);
    return this.shiftsService.getTeamSchedule(teamId, start, end);
  }

  @Get('department/:departmentId/schedule')
  @Roles('MANAGER', 'ADMIN')
  async getDepartmentSchedule(
    @Param('departmentId') departmentId: string,
    @Query('start') startStr: string,
    @Query('end') endStr: string,
    @CurrentUser() user: any,
  ) {
    // Verify manager has access to this department
    if (user.roles.includes('MANAGER')) {
      const manager = await this.prisma.user.findUnique({
        where: { id: user.userId },
        include: { workerProfile: true },
      });

      if (manager?.workerProfile?.departmentId !== departmentId) {
        throw new ForbiddenException(
          'You can only view your own department schedule',
        );
      }
    }

    const start = new Date(startStr);
    const end = new Date(endStr);
    return this.shiftsService.getDepartmentSchedule(departmentId, start, end);
  }

  @Get('worker/:id/current')
  @Roles('SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'ADMIN', 'WORKER')
  async getCurrentShift(
    @Param('id') workerId: string,
    @CurrentUser() user: any,
  ) {
    // Workers can only view their own current shift
    if (user.roles.includes('WORKER') && user.workerProfileId !== workerId) {
      throw new ForbiddenException('You can only view your own current shift');
    }

    return this.shiftsService.getWorkerCurrentShift(workerId);
  }

  @Put('worker/:id/rotation-pattern')
  @Roles('SUPERVISOR', 'HR_ADMIN', 'ADMIN')
  async updateRotationPattern(
    @Param('id') workerId: string,
    @Body('pattern') pattern: string[],
  ) {
    if (!pattern || !Array.isArray(pattern)) {
      throw new BadRequestException('Pattern must be an array of shift names');
    }
    return this.shiftsService.updateRotationPattern(workerId, pattern);
  }
}
