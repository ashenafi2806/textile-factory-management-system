import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
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
import { MaintenanceService } from './maintenance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleType } from '@prisma/client';
import { CreateTaskDto } from './dto/create-task.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { ReportFailureDto } from './dto/report-failure.dto';
import { GetTasksQueryDto } from './dto/get-tasks-query.dto';

@ApiTags('maintenance')
@ApiBearerAuth('jwt')
@Controller('maintenance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @ApiOperation({ summary: 'Create a maintenance task' })
  @ApiBody({ type: CreateTaskDto })
  @ApiResponse({ status: 201, description: 'Created' })
  @Post('tasks')
  @Roles(RoleType.MAINTENANCE_MANAGER, RoleType.ADMIN)
  createTask(@Body() dto: CreateTaskDto, @Req() req: any) {
    return this.maintenanceService.createTask(dto, req.user.id);
  }

  @ApiOperation({ summary: 'Schedule a preventive maintenance task' })
  @ApiBody({ type: CreateTaskDto })
  @ApiResponse({ status: 201, description: 'Scheduled' })
  @Post('tasks/preventive')
  @Roles(RoleType.MAINTENANCE_MANAGER, RoleType.ADMIN)
  schedulePreventive(@Body() dto: CreateTaskDto, @Req() req: any) {
    return this.maintenanceService.schedulePreventiveTask(dto, req.user.id);
  }

  @ApiOperation({ summary: 'Assign a maintenance task to a technician' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: AssignTaskDto })
  @ApiResponse({ status: 200, description: 'Assigned' })
  @Patch('tasks/:id/assign')
  @Roles(RoleType.MAINTENANCE_MANAGER, RoleType.ADMIN)
  assignTask(@Param('id') taskId: string, @Body() dto: AssignTaskDto) {
    return this.maintenanceService.assignTask(taskId, dto);
  }

  @ApiOperation({ summary: 'Mark a maintenance task as complete' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: CompleteTaskDto })
  @ApiResponse({ status: 200, description: 'Completed' })
  @Patch('tasks/:id/complete')
  @Roles(
    RoleType.MAINTENANCE_TECHNICIAN,
    RoleType.MAINTENANCE_MANAGER,
    RoleType.ADMIN,
  )
  completeTask(
    @Param('id') taskId: string,
    @Body() dto: CompleteTaskDto,
    @Req() req: any,
  ) {
    return this.maintenanceService.completeTask(taskId, dto, req.user.id);
  }

  @ApiOperation({ summary: 'Report a production failure' })
  @ApiBody({ type: ReportFailureDto })
  @ApiResponse({ status: 201, description: 'Failure report created' })
  @Post('failures')
  @Roles(
    RoleType.PRODUCTION_SUPERVISOR,
    RoleType.MAINTENANCE_MANAGER,
    RoleType.ADMIN,
  )
  reportFailure(@Body() dto: ReportFailureDto, @Req() req: any) {
    return this.maintenanceService.reportFailure(dto, req.user.id);
  }

  @ApiOperation({ summary: 'Request spare parts for a task' })
  @ApiParam({ name: 'id' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['itemId', 'quantityRequested'],
      properties: {
        itemId: { type: 'string' },
        quantityRequested: { type: 'integer' },
        purpose: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Requisition created' })
  @Post('tasks/:id/spare-parts-request')
  @Roles(
    RoleType.MAINTENANCE_MANAGER,
    RoleType.MAINTENANCE_TECHNICIAN,
    RoleType.ADMIN,
  )
  requestSpareParts(
    @Param('id') taskId: string,
    @Body()
    dto: {
      itemId: string;
      quantityRequested: number;
      purpose?: string;
    },
    @Req() req: any,
  ) {
    return this.maintenanceService.createSparePartRequisition(
      taskId,
      dto,
      req.user.id,
    );
  }

  @ApiOperation({ summary: 'List maintenance tasks' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'assignedToId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Paginated list' })
  @Get('tasks')
  @Roles(RoleType.MAINTENANCE_MANAGER, RoleType.ADMIN)
  getTasks(@Query() query: GetTasksQueryDto) {
    return this.maintenanceService.getTasks(query);
  }

  @ApiOperation({ summary: 'My assigned maintenance tasks' })
  @ApiResponse({ status: 200, description: 'Array of tasks' })
  @Get('tasks/mine')
  @Roles(
    RoleType.MAINTENANCE_TECHNICIAN,
    RoleType.MAINTENANCE_MANAGER,
    RoleType.ADMIN,
  )
  getMyTasks(@Req() req: any) {
    return this.maintenanceService.getMyTasks(req.user.id);
  }

  @ApiOperation({ summary: 'Get a maintenance task by ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Task' })
  @Get('tasks/:id')
  @Roles(
    RoleType.MAINTENANCE_TECHNICIAN,
    RoleType.MAINTENANCE_MANAGER,
    RoleType.ADMIN,
  )
  getTask(@Param('id') taskId: string) {
    return this.maintenanceService.getTask(taskId);
  }

  @ApiOperation({ summary: 'Maintenance analytics' })
  @ApiResponse({ status: 200, description: 'Analytics' })
  @Get('analytics')
  @Roles(RoleType.MAINTENANCE_MANAGER, RoleType.ADMIN)
  getAnalytics() {
    return this.maintenanceService.getAnalytics();
  }

  @ApiOperation({ summary: 'Advanced maintenance reports' })
  @ApiQuery({ name: 'days', required: false, example: 90 })
  @ApiResponse({ status: 200, description: 'Reports' })
  @Get('reports/advanced')
  @Roles(RoleType.MAINTENANCE_MANAGER, RoleType.ADMIN)
  getAdvancedReports(@Query('days') days?: string) {
    const d = days ? Number(days) : 90;
    return this.maintenanceService.getAdvancedReports(d);
  }

  @ApiOperation({ summary: 'Maintenance planning calendar' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiResponse({ status: 200, description: 'Calendar events' })
  @Get('planning/calendar')
  @Roles(RoleType.MAINTENANCE_MANAGER, RoleType.ADMIN)
  getPlanningCalendar(@Query('from') from?: string, @Query('to') to?: string) {
    return this.maintenanceService.getPlanningCalendar({ from, to });
  }
}
