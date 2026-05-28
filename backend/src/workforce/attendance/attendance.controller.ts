/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller('workforce/attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post()
  @Roles('SUPERVISOR', 'ADMIN')
  record(
    @CurrentUser() user: any,
    @Body()
    data: {
      workerId: string;
      date: string;
      checkIn: string;
      checkOut?: string;
    },
  ) {
    return this.attendanceService.recordAttendance({
      ...data,
      date: new Date(data.date),
      checkIn: new Date(data.checkIn),
      checkOut: data.checkOut ? new Date(data.checkOut) : undefined,
      recordedById: user.id,
    });
  }

  @Post('check-in')
  @Roles('WORKER', 'SUPERVISOR', 'MANAGER', 'ADMIN')
  checkIn(@CurrentUser() user: any) {
    return this.attendanceService.checkIn(user.userId);
  }

  @Post('check-out')
  @Roles('WORKER', 'SUPERVISOR', 'MANAGER', 'ADMIN')
  checkOut(@CurrentUser() user: any) {
    return this.attendanceService.checkOut(user.userId);
  }

  @Get('team/:teamId')
  @Roles('SUPERVISOR', 'MANAGER', 'ADMIN')
  getTeamAttendance(
    @Param('teamId') teamId: string,
    @Query('date') dateStr: string,
    @CurrentUser() user: any,
  ) {
    const date = dateStr ? new Date(dateStr) : new Date();
    if (user.roles.includes('MANAGER')) {
      return this.attendanceService.getAttendanceForTeam(
        teamId,
        date,
        user.userId,
      );
    }
    return this.attendanceService.getAttendanceForTeam(teamId, date);
  }

  @Get('analytics')
  @Roles('MANAGER', 'HR_ADMIN', 'ADMIN')
  getAnalytics(
    @CurrentUser() user: any,
    @Query('start') startStr?: string,
    @Query('end') endStr?: string,
  ) {
    const start = startStr ? new Date(startStr) : undefined;
    const end = endStr ? new Date(endStr) : undefined;

    if (user.roles.includes('MANAGER')) {
      return this.attendanceService.getAttendanceAnalytics(
        user.userId,
        start,
        end,
      );
    }
    return this.attendanceService.getAttendanceAnalytics(undefined, start, end);
  }

  @Get('my-attendance')
  @Roles('WORKER', 'SUPERVISOR', 'MANAGER')
  async getMyAttendance(
    @CurrentUser() user: any,
    @Query('start') startStr?: string,
    @Query('end') endStr?: string,
  ) {
    const start = startStr ? new Date(startStr) : undefined;
    const end = endStr ? new Date(endStr) : undefined;
    const workerProfileId =
      user.workerProfileId ||
      (await this.attendanceService.getWorkerProfileId(user.userId));

    return this.attendanceService.getAttendanceByWorker(
      workerProfileId,
      start,
      end,
    );
  }
}
