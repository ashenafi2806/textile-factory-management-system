import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
    return this.productionService.createOrder(body, user.userId);
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
    return this.productionService.completeStage(id, stageId, user.userId);
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
      user.userId,
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
    return this.productionService.recordOutput(id, body, user.userId);
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
    return this.productionService.reportIssue(id, body, user.userId);
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return this.productionService.recordInspection(
      id,
      stageId,
      user.userId,
      body,
    );
  }

  @Get('qa/inspections')
  @Roles('QA_STAFF', 'QA_MANAGER', 'ADMIN')
  getAllInspections() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return this.productionService.listInspections();
  }

  @Get(':id/qa/inspections')
  @Roles('QA_STAFF', 'QA_MANAGER', 'ADMIN')
  @UseGuards(AssignedOrderGuard)
  getOrderInspections(@Param('id') id: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return this.productionService.listInspections(id);
  }

  @Get('qa/thresholds')
  @Roles('QA_MANAGER', 'ADMIN')
  getQualityThresholds() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, prettier/prettier
    return this.productionService.upsertQualityThreshold(stageName, body, user.userId);
  }

  @Get('qa/dashboard')
  @Roles('QA_MANAGER', 'ADMIN')
  getQualityDashboard() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
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

  // ============= REPORTS =============

  @Get('reports/summary')
  @Roles('PRODUCTION_MANAGER', 'MANAGER', 'ADMIN')
  getSummaryReport() {
    return this.productionService.getSummaryReport();
  }

  @Get('reports/performance')
  @Roles('PRODUCTION_MANAGER', 'MANAGER', 'ADMIN')
  getPerformanceReport() {
    return this.productionService.getPerformanceReport();
  }
}
