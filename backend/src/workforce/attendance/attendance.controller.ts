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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import logger from '../../logger';
import {
  RecordAttendanceDto,
  UpdateAttendanceDto,
} from './dto/attendance.dto';

@ApiTags('workforce/attendance')
@ApiBearerAuth('jwt')
@Controller('workforce/attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @ApiOperation({ summary: 'Record (or update) a check-in/check-out for a worker on a date' })
  @ApiBody({ type: RecordAttendanceDto })
  @ApiResponse({ status: 201, description: 'Attendance recorded' })
  @Post()
  @Roles('SUPERVISOR', 'ADMIN', 'HR_ADMIN')
  record(@CurrentUser() user: any, @Body() data: RecordAttendanceDto) {
    const dateOnly = data.date
      ? new Date(`${data.date}T00:00:00.000Z`)
      : new Date();
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

  @ApiOperation({ summary: 'Update an existing attendance record by ID' })
  @ApiParam({ name: 'id', description: 'Attendance record UUID' })
  @ApiBody({ type: UpdateAttendanceDto })
  @ApiResponse({ status: 200, description: 'Updated' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put(':id')
  @Roles('SUPERVISOR', 'ADMIN', 'HR_ADMIN')
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() data: UpdateAttendanceDto,
  ) {
    return this.attendanceService.updateAttendance(id, {
      checkIn: data.checkIn ? new Date(data.checkIn) : undefined,
      checkOut: data.checkOut ? new Date(data.checkOut) : undefined,
      recordedById: user.id,
    });
  }

  @ApiOperation({ summary: 'Delete an attendance record' })
  @ApiParam({ name: 'id', description: 'Attendance record UUID' })
  @ApiResponse({ status: 200, description: 'Deleted' })
  @Delete(':id')
  @Roles('SUPERVISOR', 'ADMIN', 'HR_ADMIN')
  remove(@Param('id') id: string) {
    return this.attendanceService.deleteAttendance(id);
  }

  @ApiOperation({
    summary: 'Get all attendance records for a team on a date (records only)',
  })
  @ApiParam({ name: 'teamId', description: 'Department name (used as team key)' })
  @ApiQuery({ name: 'date', required: false, example: '2026-06-01' })
  @ApiResponse({ status: 200, description: 'Array of attendance records' })
  @Get('team/:teamId')
  @Roles('SUPERVISOR', 'MANAGER', 'ADMIN', 'HR_ADMIN')
  getTeamAttendance(
    @Param('teamId') teamId: string,
    @Query('date') dateStr: string,
    @CurrentUser() user: any,
  ) {
    const date = dateStr ? new Date(`${dateStr}T00:00:00.000Z`) : new Date();
    logger.info('attendance.getTeam.request', {
      teamId,
      date: date.toISOString(),
      requestedBy: user?.id,
    });

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

  @ApiOperation({
    summary: 'List all workers with their attendance status for a date',
  })
  @ApiQuery({ name: 'date', required: false, example: '2026-06-01' })
  @ApiResponse({
    status: 200,
    description:
      'Array of { workerId, worker, attendance | null, status: Present | Absent | On Leave }',
  })
  @Get()
  @Roles('SUPERVISOR', 'MANAGER', 'ADMIN', 'HR_ADMIN')
  getAttendanceByDate(
    @Query('date') dateStr: string,
    @CurrentUser() user: any,
  ) {
    const date = dateStr ? new Date(`${dateStr}T00:00:00.000Z`) : new Date();
    logger.info('attendance.getAll.request', {
      date: date.toISOString(),
      requestedBy: user?.id,
    });
    if (user.roles.includes('MANAGER')) {
      return this.attendanceService.getAttendanceForDate(date, user.userId);
    }
    return this.attendanceService.getAttendanceForDate(date);
  }

  @ApiOperation({ summary: 'Get attendance analytics for a date range' })
  @ApiQuery({ name: 'start', required: false, example: '2026-05-01' })
  @ApiQuery({ name: 'end', required: false, example: '2026-06-01' })
  @ApiResponse({ status: 200, description: 'Aggregated analytics' })
  @Get('analytics')
  @Roles('MANAGER', 'HR_ADMIN', 'ADMIN', 'SUPERVISOR')
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

  @ApiOperation({ summary: 'Get the authenticated worker attendance history' })
  @ApiQuery({ name: 'start', required: false, example: '2026-05-01' })
  @ApiQuery({ name: 'end', required: false, example: '2026-06-01' })
  @ApiResponse({ status: 200, description: 'Array of attendance records' })
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
