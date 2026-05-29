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
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import logger from '../../logger';

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
    // Treat incoming `date` as a date-only string (YYYY-MM-DD).
    // Construct an explicit UTC midnight for that date to avoid timezone ambiguity.
    const dateOnly = data.date
      ? new Date(`${data.date}T00:00:00.000Z`)
      : new Date();
    // log incoming attendance record attempts for debugging
    logger.info('attendance.record.request', {
      workerId: data.workerId,
      date: dateOnly.toISOString(),
      recordedBy: user?.id,
      path: 'workforce/attendance',
    });
    return this.attendanceService.recordAttendance({
      workerId: data.workerId,
      date: dateOnly,
      checkIn: new Date(data.checkIn),
      checkOut: data.checkOut ? new Date(data.checkOut) : undefined,
      recordedById: user.id,
    });
  }

  @Put(':id')
  @Roles('SUPERVISOR', 'ADMIN')
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body()
    data: { checkIn?: string; checkOut?: string },
  ) {
    return this.attendanceService.updateAttendance(id, {
      checkIn: data.checkIn ? new Date(data.checkIn) : undefined,
      checkOut: data.checkOut ? new Date(data.checkOut) : undefined,
      recordedById: user.id,
    });
  }

  @Delete(':id')
  @Roles('SUPERVISOR', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.attendanceService.deleteAttendance(id);
  }

  @Get('team/:teamId')
  @Roles('SUPERVISOR', 'MANAGER', 'ADMIN')
  getTeamAttendance(
    @Param('teamId') teamId: string,
    @Query('date') dateStr: string,
    @CurrentUser() user: any,
  ) {
    // Parse date query as date-only in UTC to match service behavior
    const date = dateStr ? new Date(`${dateStr}T00:00:00.000Z`) : new Date();
    logger.info('attendance.getTeam.request', {
      teamId,
      date: date.toISOString(),
      requestedBy: user?.id,
    });

    // await the service so we can log the actual returned records for debugging
    if (user.roles.includes('MANAGER')) {
      return this.attendanceService
        .getAttendanceForTeam(teamId, date, user.userId)
        .then((res) => {
          try {
            logger.info('attendance.getTeam.return', {
              teamId,
              date: date.toISOString(),
              count: res.length,
            });
          } catch (e) {
            // ignore
          }
          return res;
        });
    }

    return this.attendanceService
      .getAttendanceForTeam(teamId, date)
      .then((res) => {
        try {
          logger.info('attendance.getTeam.return', {
            teamId,
            date: date.toISOString(),
            count: res.length,
          });
        } catch (e) {}
        return res;
      });
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
  getMyAttendance(
    @CurrentUser() user: any,
    @Query('start') startStr?: string,
    @Query('end') endStr?: string,
  ) {
    const start = startStr ? new Date(startStr) : undefined;
    const end = endStr ? new Date(endStr) : undefined;
    return this.attendanceService.getAttendanceByWorker(
      user.workerProfileId,
      start,
      end,
    );
  }
}
