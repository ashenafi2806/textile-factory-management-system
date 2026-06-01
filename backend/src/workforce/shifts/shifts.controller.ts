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
  Delete,
  UseGuards,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
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
import { ShiftsService } from './shifts.service';
import { AssignShiftDto, UpdateRotationPatternDto } from './dto/assign-shift.dto';
import { CreateShiftDto } from './dto/create-shift.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('workforce/shifts')
@ApiBearerAuth('jwt')
@Controller('workforce/shifts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShiftsController {
  constructor(
    private shiftsService: ShiftsService,
    private prisma: PrismaService,
  ) {}

  private async resolveWorkerProfileId(user: any) {
    if (user?.workerProfileId) {
      return user.workerProfileId;
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user?.userId ?? user?.id ?? user?.sub },
      select: { workerProfile: { select: { id: true } } },
    });

    return dbUser?.workerProfile?.id ?? null;
  }

  @ApiOperation({ summary: 'Create a shift definition' })
  @ApiBody({ type: CreateShiftDto })
  @ApiResponse({ status: 201, description: 'Shift created' })
  @Post()
  @Roles('HR_ADMIN', 'ADMIN', 'SUPERVISOR')
  create(@Body() data: CreateShiftDto) {
    return this.shiftsService.createShift(data);
  }

  @ApiOperation({ summary: 'List all shifts' })
  @ApiResponse({ status: 200, description: 'Array of shifts' })
  @Get()
  @Roles('HR_ADMIN', 'ADMIN', 'SUPERVISOR', 'MANAGER')
  findAll() {
    return this.shiftsService.findAll();
  }

  @ApiOperation({ summary: 'Get a worker shift for a given date' })
  @ApiParam({ name: 'id', description: 'Worker UUID' })
  @ApiQuery({ name: 'date', required: false, example: '2026-06-01' })
  @ApiResponse({ status: 200, description: 'Shift info' })
  @Get('worker/:id')
  @Roles('SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'ADMIN', 'WORKER')
  async getWorkerShift(
    @Param('id') workerId: string,
    @Query('date') dateStr: string,
    @CurrentUser() user: any,
  ) {
    if (user.roles.includes('WORKER') && user.workerProfileId !== workerId) {
      throw new ForbiddenException('You can only view your own shift');
    }
    const date = dateStr ? new Date(dateStr) : new Date();
    return this.shiftsService.getShiftForDate(workerId, date);
  }

  @ApiOperation({ summary: 'Get a worker schedule for a date range' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'start', example: '2026-06-01' })
  @ApiQuery({ name: 'end', example: '2026-06-07' })
  @ApiResponse({ status: 200, description: 'Array of schedule items' })
  @Get('worker/:id/schedule')
  @Roles('SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'ADMIN', 'WORKER')
  async getWorkerSchedule(
    @Param('id') workerId: string,
    @Query('start') startStr: string,
    @Query('end') endStr: string,
    @CurrentUser() user: any,
  ) {
    if (user.roles.includes('WORKER') && user.workerProfileId !== workerId) {
      throw new ForbiddenException('You can only view your own schedule');
    }
    const start = new Date(startStr);
    const end = new Date(endStr);
    return this.shiftsService.generateScheduleForRange(workerId, start, end);
  }

  @ApiOperation({ summary: 'Get upcoming shifts for a worker' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'days', required: false, example: 7 })
  @ApiResponse({ status: 200, description: 'Array of schedule items' })
  @Get('worker/:id/upcoming')
  @Roles('SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'ADMIN', 'WORKER')
  async getUpcomingShifts(
    @Param('id') workerId: string,
    @Query('days') days: string,
    @CurrentUser() user: any,
  ) {
    if (user.roles.includes('WORKER') && user.workerProfileId !== workerId) {
      throw new ForbiddenException('You can only view your own shifts');
    }
    const daysNum = days ? parseInt(days) : 7;
    return this.shiftsService.getUpcomingShifts(workerId, daysNum);
  }

  @ApiOperation({ summary: 'Get the full schedule for a team (department)' })
  @ApiParam({ name: 'teamId', description: 'Department name' })
  @ApiQuery({ name: 'start' })
  @ApiQuery({ name: 'end' })
  @ApiResponse({ status: 200, description: 'Array of team schedule items' })
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

  @ApiOperation({ summary: 'Get the full schedule for a department' })
  @ApiParam({ name: 'department' })
  @ApiQuery({ name: 'start' })
  @ApiQuery({ name: 'end' })
  @ApiResponse({ status: 200, description: 'Array of team schedule items' })
  @Get('department/:department/schedule')
  @Roles('MANAGER', 'ADMIN', 'SUPERVISOR')
  async getDepartmentSchedule(
    @Param('department') department: string,
    @Query('start') startStr: string,
    @Query('end') endStr: string,
    @CurrentUser() user: any,
  ) {
    if (user.roles.includes('MANAGER')) {
      const manager = await this.prisma.user.findUnique({
        where: { id: user.userId },
        include: { workerProfile: true },
      });

      if (manager?.workerProfile?.department !== department) {
        throw new ForbiddenException(
          'You can only view your own department schedule',
        );
      }
    }

    const start = new Date(startStr);
    const end = new Date(endStr);
    return this.shiftsService.getDepartmentSchedule(department, start, end);
  }

  @ApiOperation({ summary: 'Get a worker current shift' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Shift info' })
  @Get('worker/:id/current')
  @Roles('SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'ADMIN', 'WORKER')
  async getCurrentShift(
    @Param('id') workerId: string,
    @CurrentUser() user: any,
  ) {
    if (user.roles.includes('WORKER') && user.workerProfileId !== workerId) {
      throw new ForbiddenException('You can only view your own current shift');
    }

    return this.shiftsService.getWorkerCurrentShift(workerId);
  }

  @ApiOperation({ summary: 'Assign a shift to a worker on a specific date' })
  @ApiBody({ type: AssignShiftDto })
  @ApiResponse({ status: 201, description: 'Shift assigned' })
  @Post('assign')
  @Roles('HR_ADMIN', 'ADMIN', 'SUPERVISOR', 'MANAGER')
  async assignShift(@Body() payload: AssignShiftDto, @CurrentUser() user: any) {
    const createdById = user?.userId ?? user?.id ?? null;
    const date = new Date(payload.date);
    return this.shiftsService.assignShift(
      payload.workerId,
      payload.shiftId,
      date,
      createdById,
    );
  }

  @ApiOperation({ summary: 'Remove a shift assignment' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Deleted' })
  @Delete('assign/:id')
  @Roles('HR_ADMIN', 'ADMIN', 'SUPERVISOR', 'MANAGER')
  async unassignShift(@Param('id') assignmentId: string) {
    return this.shiftsService.unassignShift(assignmentId);
  }

  @ApiOperation({ summary: 'List shift assignments for a worker' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'start', required: false })
  @ApiQuery({ name: 'end', required: false })
  @ApiResponse({ status: 200, description: 'Array of assignments' })
  @Get('worker/:id/assignments')
  @Roles('SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'ADMIN', 'WORKER')
  async getWorkerAssignments(
    @Param('id') workerId: string,
    @Query('start') startStr: string,
    @Query('end') endStr: string,
    @CurrentUser() user: any,
  ) {
    if (user.roles.includes('WORKER') && user.workerProfileId !== workerId) {
      throw new ForbiddenException('You can only view your own assignments');
    }
    const start = startStr ? new Date(startStr) : undefined;
    const end = endStr ? new Date(endStr) : undefined;
    return this.shiftsService.getAssignmentsForWorker(workerId, start, end);
  }

  @ApiOperation({ summary: "Get the authenticated worker's current shift" })
  @ApiResponse({ status: 200, description: 'Shift info' })
  @ApiResponse({ status: 404, description: 'Worker profile not found' })
  @Get('my-current')
  @Roles('WORKER', 'SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'ADMIN')
  async getMyCurrentShift(@CurrentUser() user: any) {
    const workerId = await this.resolveWorkerProfileId(user);
    if (!workerId) {
      throw new NotFoundException('Worker profile not found');
    }
    return this.shiftsService.getWorkerCurrentShift(workerId);
  }

  @ApiOperation({ summary: "Get the authenticated worker's upcoming shifts" })
  @ApiQuery({ name: 'days', required: false, example: 30 })
  @ApiResponse({ status: 200, description: 'Array of schedule items' })
  @Get('my-shifts')
  @Roles('WORKER', 'SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'ADMIN')
  async getMyUpcomingShifts(
    @CurrentUser() user: any,
    @Query('days') days: string,
  ) {
    const workerId = await this.resolveWorkerProfileId(user);
    if (!workerId) {
      throw new NotFoundException('Worker profile not found');
    }
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.shiftsService.getUpcomingShifts(workerId, daysNum);
  }

  @ApiOperation({ summary: "Get the authenticated worker's schedule" })
  @ApiQuery({ name: 'start', required: false })
  @ApiQuery({ name: 'end', required: false })
  @ApiResponse({ status: 200, description: 'Array of schedule items' })
  @Get('my-schedule')
  @Roles('WORKER', 'SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'ADMIN')
  async getMySchedule(
    @CurrentUser() user: any,
    @Query('start') startStr?: string,
    @Query('end') endStr?: string,
  ) {
    const workerId = await this.resolveWorkerProfileId(user);
    if (!workerId) {
      throw new NotFoundException('Worker profile not found');
    }
    const start = startStr ? new Date(startStr) : new Date();
    const end = endStr
      ? new Date(endStr)
      : (() => {
          const d = new Date();
          d.setDate(d.getDate() + 7);
          return d;
        })();
    return this.shiftsService.generateScheduleForRange(workerId, start, end);
  }

  @ApiOperation({ summary: "Update a worker's rotation pattern" })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateRotationPatternDto })
  @ApiResponse({ status: 200, description: 'Updated' })
  @ApiResponse({ status: 400, description: 'Invalid pattern' })
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
