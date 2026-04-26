import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
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
    @Body() data: { workerId: string; date: string; checkIn: string; checkOut?: string },
  ) {
    return this.attendanceService.recordAttendance({
      ...data,
      date: new Date(data.date),
      checkIn: new Date(data.checkIn),
      checkOut: data.checkOut ? new Date(data.checkOut) : undefined,
      recordedById: user.id,
    });
  }

  @Get('team/:teamId')
  @Roles('SUPERVISOR', 'MANAGER', 'ADMIN')
  getTeamAttendance(
    @Param('teamId') teamId: string,
    @Query('date') dateStr: string,
  ) {
    const date = dateStr ? new Date(dateStr) : new Date();
    return this.attendanceService.getAttendanceForTeam(teamId, date);
  }
}
