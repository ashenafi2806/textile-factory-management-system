import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AssignedOrderGuard } from './guards/assigned-order.guard';
import { MaterialAvailabilityGuard } from './guards/material-availability.guard';
import { QAApprovalGuard } from './guards/qa-approval.guard';
import { StageSequenceGuard } from './guards/stage-sequence.guard';
import { ProductionIssueStatus, ProductionStageName } from '@prisma/client';
import { ProductionService } from './production.service';
import { CreateProductionOrderDto } from './dto/create-production-order.dto';
import { UpdateProductionOrderDto } from './dto/update-production-order.dto';
import { RecordOutputDto } from './dto/record-output.dto';
import { ReportIssueDto } from './dto/report-issue.dto';
import { QaReviewDto } from './dto/qa-review.dto';

type CurrentUserPayload = {
  userId: string;
  roles: string[];
};

function getCurrentUserId(
  user: CurrentUserPayload & { id?: string; sub?: string },
) {
  return user.userId ?? user.id ?? user.sub;
}

@Controller('production')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductionOrdersController {
  constructor(
    private readonly productionService: ProductionService, // Use this single service
  ) {}

  // ============= ORDER MANAGEMENT =============

  @Post()
  @Roles('PRODUCTION_MANAGER', 'ADMIN')
  createOrder(
    @Body() body: CreateProductionOrderDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.productionService.createOrder(body, getCurrentUserId(user));
  }

  @Get()
  @Roles(
    'PRODUCTION_MANAGER',
    'PRODUCTION_SUPERVISOR',
    'QA_MANAGER',
    'QA_STAFF',
    'ADMIN',
    'MANAGER',
  )
  listOrders(@CurrentUser() user: CurrentUserPayload) {
    return this.productionService.listOrders(user);
  }

  @Get(':id')
  @UseGuards(AssignedOrderGuard)
  @Roles(
    'PRODUCTION_MANAGER',
    'PRODUCTION_SUPERVISOR',
    'QA_MANAGER',
    'QA_STAFF',
    'STOREKEEPER',
    'ADMIN',
    'MANAGER',
  )
  getOrder(@Param('id') id: string) {
    return this.productionService.getOrderById(id);
  }

  @Patch(':id')
  @Roles('PRODUCTION_MANAGER', 'ADMIN')
  updateOrder(@Param('id') id: string, @Body() body: UpdateProductionOrderDto) {
    return this.productionService.updateOrder(id, body);
  }

  @Patch(':id/approve')
  @Roles('PRODUCTION_MANAGER', 'ADMIN')
  @UseGuards(MaterialAvailabilityGuard)
  approveOrder(@Param('id') id: string) {
    return this.productionService.approveOrder(id);
  }

  @Delete(':id')
  @Roles('PRODUCTION_MANAGER', 'ADMIN')
  cancelOrder(@Param('id') id: string) {
    return this.productionService.cancelOrder(id);
  }

  @Post(':id/assign')
  @Roles('PRODUCTION_MANAGER', 'ADMIN')
  assignSupervisor(
    @Param('id') id: string,
    @Body('supervisorId') supervisorId: string,
  ) {
    return this.productionService.assignSupervisor(id, supervisorId);
  }

  // ============= MATERIAL MANAGEMENT =============

  @Get(':id/material-check')
  @Roles('PRODUCTION_MANAGER', 'PRODUCTION_SUPERVISOR', 'STOREKEEPER', 'ADMIN')
  @UseGuards(MaterialAvailabilityGuard)
  checkMaterial(@Param('id') id: string) {
    return this.productionService.checkMaterial(id);
  }

  @Get('monitoring/summary')
  @Roles('PRODUCTION_MANAGER', 'ADMIN')
  getMonitoringSummary() {
    return this.productionService.getMonitoringSummary();
  }

  @Post(':id/release')
  @Roles('QA_MANAGER', 'ADMIN')
  releaseOrder(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.productionService.releaseOrder(id, getCurrentUserId(user));
  }

  @Get('reports/performance')
  @Roles('PRODUCTION_MANAGER', 'MANAGER', 'ADMIN')
  getPerformanceReport() {
    return this.productionService.getPerformanceReport();
  }

  @Get('reports/quality')
  @Roles('QA_MANAGER', 'ADMIN')
  getQualityReport(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('productId') productId?: string,
  ) {
    return this.productionService.getQualityReport({ from, to, productId });
  }

  @Get('reports/output')
  @Roles('PRODUCTION_MANAGER', 'PRODUCTION_SUPERVISOR', 'MANAGER', 'ADMIN')
  getOutputReport(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('orderId') orderId?: string,
  ) {
    return this.productionService.getOutputReport({ from, to, orderId });
  }

  @Get('reports/issues')
  @Roles('PRODUCTION_MANAGER', 'PRODUCTION_SUPERVISOR', 'QA_MANAGER', 'ADMIN')
  getIssueReport(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('orderId') orderId?: string,
  ) {
    return this.productionService.getIssueReport({ from, to, orderId });
  }

  // ============= STAGE MANAGEMENT =============

  @Post(':id/stages/:stageId/start')
  @Roles('PRODUCTION_SUPERVISOR', 'ADMIN')
  @UseGuards(AssignedOrderGuard, MaterialAvailabilityGuard, StageSequenceGuard)
  startStage(@Param('id') id: string, @Param('stageId') stageId: string) {
    return this.productionService.startStage(id, stageId);
  }

  @Post(':id/stages/:stageId/stop')
  @Roles('PRODUCTION_SUPERVISOR', 'ADMIN')
  @UseGuards(AssignedOrderGuard)
  stopStage(@Param('id') id: string, @Param('stageId') stageId: string) {
    return this.productionService.stopStage(id, stageId);
  }

  @Post(':id/stages/:stageId/resume')
  @Roles('PRODUCTION_SUPERVISOR', 'ADMIN')
  @UseGuards(AssignedOrderGuard, StageSequenceGuard)
  resumeStage(@Param('id') id: string, @Param('stageId') stageId: string) {
    return this.productionService.resumeStage(id, stageId);
  }

  @Post(':id/stages/:stageId/complete')
  @Roles('PRODUCTION_SUPERVISOR', 'ADMIN')
  @UseGuards(AssignedOrderGuard)
  completeStage(
    @Param('id') id: string,
    @Param('stageId') stageId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.productionService.completeStage(
      id,
      stageId,
      getCurrentUserId(user),
    );
  }

  // ============= QA MANAGEMENT =============

  @Post(':id/stages/:stageId/qa-review')
  @Roles('QA_STAFF', 'QA_MANAGER', 'ADMIN')
  @UseGuards(QAApprovalGuard)
  qaReview(
    @Param('id') id: string,
    @Param('stageId') stageId: string,
    @Body() body: QaReviewDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.productionService.qaReview(
      id,
      stageId,
      body.action,
      getCurrentUserId(user),
    );
  }

  @Post(':id/stages/:stageId/qa-inspection')
  @Roles('QA_STAFF', 'QA_MANAGER', 'PRODUCTION_SUPERVISOR', 'ADMIN')
  @UseGuards(AssignedOrderGuard)
  createInspection(
    @Param('id') id: string,
    @Param('stageId') stageId: string,
    @Body()
    body: {
      measurements?: string;
      defects?: number;
      result: string;
      notes?: string;
      status?: string;
    },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.productionService.recordInspection(
      id,
      stageId,
      getCurrentUserId(user),
      body,
    );
  }

  @Patch(':id/stages/:stageId/qa-inspection/:inspectionId/approve')
  @Roles('QA_MANAGER', 'ADMIN')
  approveInspection(
    @Param('id') id: string,
    @Param('stageId') stageId: string,
    @Param('inspectionId') inspectionId: string,
  ) {
    return this.productionService.approveInspection(id, stageId, inspectionId);
  }

  @Patch(':id/stages/:stageId/qa-inspection/:inspectionId/reject')
  @Roles('QA_MANAGER', 'ADMIN')
  rejectInspection(
    @Param('id') id: string,
    @Param('stageId') stageId: string,
    @Param('inspectionId') inspectionId: string,
    @Body('reason') reason: string,
  ) {
    return this.productionService.rejectInspection(
      id,
      stageId,
      inspectionId,
      reason,
    );
  }

  // ============= OUTPUT MANAGEMENT =============

  @Post(':id/output')
  @Roles('PRODUCTION_SUPERVISOR', 'QA_STAFF', 'QA_MANAGER', 'ADMIN')
  @UseGuards(AssignedOrderGuard)
  recordOutput(
    @Param('id') id: string,
    @Body() body: RecordOutputDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.productionService.recordOutput(
      id,
      body,
      getCurrentUserId(user),
    );
  }

  @Get(':id/output')
  @Roles(
    'PRODUCTION_MANAGER',
    'PRODUCTION_SUPERVISOR',
    'QA_MANAGER',
    'QA_STAFF',
    'ADMIN',
  )
  @UseGuards(AssignedOrderGuard)
  getOutputHistory(@Param('id') id: string) {
    return this.productionService.getOutputHistory(id);
  }

  @Get(':id/output/report')
  @Roles(
    'PRODUCTION_MANAGER',
    'PRODUCTION_SUPERVISOR',
    'QA_MANAGER',
    'QA_STAFF',
    'ADMIN',
  )
  @UseGuards(AssignedOrderGuard)
  getStageOutputReport(@Param('id') id: string) {
    return this.productionService.getStageOutputReport(id);
  }

  // ============= ISSUE MANAGEMENT =============

  @Post(':id/issues')
  @Roles(
    'PRODUCTION_SUPERVISOR',
    'QA_STAFF',
    'QA_MANAGER',
    'PRODUCTION_MANAGER',
    'ADMIN',
  )
  @UseGuards(AssignedOrderGuard)
  reportIssue(
    @Param('id') id: string,
    @Body() body: ReportIssueDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.productionService.reportIssue(id, body, getCurrentUserId(user));
  }

  @Get(':id/issues')
  @Roles(
    'PRODUCTION_MANAGER',
    'PRODUCTION_SUPERVISOR',
    'QA_MANAGER',
    'QA_STAFF',
    'ADMIN',
  )
  @UseGuards(AssignedOrderGuard)
  getIssues(@Param('id') id: string) {
    return this.productionService.getIssues(id);
  }

  // ============= QUALITY INSPECTION MANAGEMENT =============

  @Post(':id/stages/:stageId/inspection')
  @Roles('QA_STAFF', 'QA_MANAGER', 'ADMIN')
  @UseGuards(AssignedOrderGuard, QAApprovalGuard)
  recordInspection(
    @Param('id') id: string,
    @Param('stageId') stageId: string,
    @Body()
    body: {
      measurements?: string;
      defects?: number;
      result: string;
      notes?: string;
      status?: string;
    },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.productionService.recordInspection(
      id,
      stageId,
      getCurrentUserId(user),
      body,
    );
  }

  @Get('qa/inspections')
  @Roles('QA_STAFF', 'QA_MANAGER', 'ADMIN')
  getAllInspections() {
    return this.productionService.listInspections();
  }

  @Get(':id/qa/inspections')
  @Roles('QA_STAFF', 'QA_MANAGER', 'ADMIN')
  @UseGuards(AssignedOrderGuard)
  getOrderInspections(@Param('id') id: string) {
    return this.productionService.listInspections(id);
  }

  @Get('qa/thresholds')
  @Roles('QA_MANAGER', 'ADMIN')
  getQualityThresholds() {
    return this.productionService.getQualityThresholds();
  }

  @Post('qa/thresholds/:stageName')
  @Roles('QA_MANAGER', 'ADMIN')
  setQualityThreshold(
    @Param('stageName') stageName: ProductionStageName,
    @Body()
    body: {
      maxDefectsPerHundred: number;
      acceptanceCriteria: string;
      isActive?: boolean;
    },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.productionService.upsertQualityThreshold(
      stageName,
      body,
      getCurrentUserId(user),
    );
  }

  @Get('qa/dashboard')
  @Roles('QA_MANAGER', 'ADMIN')
  getQualityDashboard() {
    return this.productionService.getQualityDashboard();
  }

  @Patch(':id/issues/:issueId')
  @Roles('QA_MANAGER', 'PRODUCTION_MANAGER', 'ADMIN')
  updateIssueStatus(
    @Param('id') id: string,
    @Param('issueId') issueId: string,
    @Body('status') status: ProductionIssueStatus,
  ) {
    return this.productionService.updateIssueStatus(issueId, status);
  }

  // ============= ISSUE RESOLUTION WORKFLOWS =============

  @Post(':id/issues/:issueId/resolve-machine-failure')
  @Roles('MAINTENANCE_MANAGER', 'ADMIN')
  resolveMachineFailure(
    @Param('id') id: string,
    @Param('issueId') issueId: string,
    @Body('maintenanceTechnicianId') maintenanceTechnicianId: string,
  ) {
    return this.productionService.resolveMachineFailure(
      id,
      issueId,
      maintenanceTechnicianId,
    );
  }

  @Post(':id/issues/:issueId/resolve-material-shortage')
  @Roles('STOREKEEPER', 'ADMIN')
  resolveMaterialShortage(
    @Param('id') id: string,
    @Param('issueId') issueId: string,
    @Body('restockedMaterials')
    restockedMaterials: Array<{ materialId: string; quantity: number }>,
  ) {
    return this.productionService.resolveMaterialShortage(
      id,
      issueId,
      restockedMaterials,
    );
  }

  @Post(':id/issues/:issueId/assign-technician')
  @Roles('MAINTENANCE_MANAGER', 'ADMIN')
  assignMaintenanceTechnician(
    @Param('id') id: string,
    @Param('issueId') issueId: string,
    @Body('technicianId') technicianId: string,
  ) {
    return this.productionService.assignMaintenanceTechnician(
      id,
      issueId,
      technicianId,
    );
  }

  @Post(':id/issues/:issueId/mark-as-fixed')
  @Roles('MAINTENANCE_TECHNICIAN', 'ADMIN')
  markIssueAsFixed(
    @Param('id') id: string,
    @Param('issueId') issueId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.productionService.markIssueAsFixed(
      id,
      issueId,
      user.userId,
    );
  }
}
