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
import { MaintenanceService } from './maintenance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  RoleType,
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceType,
} from '@prisma/client';
import { CreateTaskDto } from './dto/create-task.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { ReportFailureDto } from './dto/report-failure.dto';
import { GetTasksQueryDto } from './dto/get-tasks-query.dto';

@Controller('maintenance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post('tasks')
  @Roles(RoleType.MAINTENANCE_MANAGER, RoleType.ADMIN)
  createTask(@Body() dto: CreateTaskDto, @Req() req: any) {
    return this.maintenanceService.createTask(dto, req.user.id);
  }

  @Post('tasks/preventive')
  @Roles(RoleType.MAINTENANCE_MANAGER, RoleType.ADMIN)
  schedulePreventive(@Body() dto: CreateTaskDto, @Req() req: any) {
    return this.maintenanceService.schedulePreventiveTask(dto, req.user.id);
  }

  @Patch('tasks/:id/assign')
  @Roles(RoleType.MAINTENANCE_MANAGER, RoleType.ADMIN)
  assignTask(@Param('id') taskId: string, @Body() dto: AssignTaskDto) {
    return this.maintenanceService.assignTask(taskId, dto);
  }

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

  @Post('failures')
  @Roles(
    RoleType.PRODUCTION_SUPERVISOR,
    RoleType.MAINTENANCE_MANAGER,
    RoleType.ADMIN,
  )
  reportFailure(@Body() dto: ReportFailureDto, @Req() req: any) {
    return this.maintenanceService.reportFailure(dto, req.user.id);
  }

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

  @Get('tasks')
  @Roles(RoleType.MAINTENANCE_MANAGER, RoleType.ADMIN)
  getTasks(@Query() query: GetTasksQueryDto) {
    return this.maintenanceService.getTasks(query);
  }

  @Get('tasks/mine')
  @Roles(
    RoleType.MAINTENANCE_TECHNICIAN,
    RoleType.MAINTENANCE_MANAGER,
    RoleType.ADMIN,
  )
  getMyTasks(@Req() req: any) {
    return this.maintenanceService.getMyTasks(req.user.id);
  }

  @Get('tasks/:id')
  @Roles(
    RoleType.MAINTENANCE_TECHNICIAN,
    RoleType.MAINTENANCE_MANAGER,
    RoleType.ADMIN,
  )
  getTask(@Param('id') taskId: string) {
    return this.maintenanceService.getTask(taskId);
  }

  @Get('analytics')
  @Roles(RoleType.MAINTENANCE_MANAGER, RoleType.ADMIN)
  getAnalytics() {
    return this.maintenanceService.getAnalytics();
  }

  @Get('reports/advanced')
  @Roles(RoleType.MAINTENANCE_MANAGER, RoleType.ADMIN)
  getAdvancedReports(@Query('days') days?: string) {
    const d = days ? Number(days) : 90;
    return this.maintenanceService.getAdvancedReports(d);
  }

  @Get('planning/calendar')
  @Roles(RoleType.MAINTENANCE_MANAGER, RoleType.ADMIN)
  getPlanningCalendar(@Query('from') from?: string, @Query('to') to?: string) {
    return this.maintenanceService.getPlanningCalendar({ from, to });
  }
}
