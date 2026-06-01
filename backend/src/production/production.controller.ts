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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
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

@ApiTags('production')
@ApiBearerAuth('jwt')
@Controller('production')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductionOrdersController {
  constructor(
    private readonly productionService: ProductionService,
  ) {}

  @ApiOperation({ summary: 'Create a production order' })
  @ApiBody({ type: CreateProductionOrderDto })
  @ApiResponse({ status: 201, description: 'Created' })
  @Post()
  @Roles('PRODUCTION_MANAGER', 'ADMIN')
  createOrder(
    @Body() body: CreateProductionOrderDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.productionService.createOrder(body, getCurrentUserId(user));
  }

  @ApiOperation({ summary: 'List production orders' })
  @ApiResponse({ status: 200, description: 'Array of orders' })
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

  @ApiOperation({ summary: 'Get a production order by ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Order' })
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

  @ApiOperation({ summary: 'Update a production order' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateProductionOrderDto })
  @ApiResponse({ status: 200, description: 'Updated' })
  @Patch(':id')
  @Roles('PRODUCTION_MANAGER', 'ADMIN')
  updateOrder(@Param('id') id: string, @Body() body: UpdateProductionOrderDto) {
    return this.productionService.updateOrder(id, body);
  }

  @ApiOperation({ summary: 'Approve an order (material availability enforced)' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Approved' })
  @Patch(':id/approve')
  @Roles('PRODUCTION_MANAGER', 'ADMIN')
  @UseGuards(MaterialAvailabilityGuard)
  approveOrder(@Param('id') id: string) {
    return this.productionService.approveOrder(id);
  }

  @ApiOperation({ summary: 'Cancel a production order' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Cancelled' })
  @Delete(':id')
  @Roles('PRODUCTION_MANAGER', 'ADMIN')
  cancelOrder(@Param('id') id: string) {
    return this.productionService.cancelOrder(id);
  }

  @ApiOperation({ summary: 'Assign a supervisor to an order' })
  @ApiParam({ name: 'id' })
  @ApiBody({ schema: { type: 'object', properties: { supervisorId: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Assigned' })
  @Post(':id/assign')
  @Roles('PRODUCTION_MANAGER', 'ADMIN')
  assignSupervisor(
    @Param('id') id: string,
    @Body('supervisorId') supervisorId: string,
  ) {
    return this.productionService.assignSupervisor(id, supervisorId);
  }

  @ApiOperation({ summary: 'Check material availability for an order' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Material report' })
  @Get(':id/material-check')
  @Roles('PRODUCTION_MANAGER', 'PRODUCTION_SUPERVISOR', 'STOREKEEPER', 'ADMIN')
  @UseGuards(MaterialAvailabilityGuard)
  checkMaterial(@Param('id') id: string) {
    return this.productionService.checkMaterial(id);
  }

  @ApiOperation({ summary: 'Production monitoring summary' })
  @ApiResponse({ status: 200, description: 'Summary metrics' })
  @Get('monitoring/summary')
  @Roles('PRODUCTION_MANAGER', 'ADMIN')
  getMonitoringSummary() {
    return this.productionService.getMonitoringSummary();
  }

  @ApiOperation({ summary: 'Release an order to the next stage' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Released' })
  @Post(':id/release')
  @Roles('QA_MANAGER', 'ADMIN')
  releaseOrder(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.productionService.releaseOrder(id, getCurrentUserId(user));
  }

  @ApiOperation({ summary: 'Performance report' })
  @ApiResponse({ status: 200, description: 'Report' })
  @Get('reports/performance')
  @Roles('PRODUCTION_MANAGER', 'MANAGER', 'ADMIN')
  getPerformanceReport() {
    return this.productionService.getPerformanceReport();
  }

  @ApiOperation({ summary: 'Quality report' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'productId', required: false })
  @ApiResponse({ status: 200, description: 'Report' })
  @Get('reports/quality')
  @Roles('QA_MANAGER', 'ADMIN')
  getQualityReport(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('productId') productId?: string,
  ) {
    return this.productionService.getQualityReport({ from, to, productId });
  }

  @ApiOperation({ summary: 'Output report' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'orderId', required: false })
  @ApiResponse({ status: 200, description: 'Report' })
  @Get('reports/output')
  @Roles('PRODUCTION_MANAGER', 'PRODUCTION_SUPERVISOR', 'MANAGER', 'ADMIN')
  getOutputReport(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('orderId') orderId?: string,
  ) {
    return this.productionService.getOutputReport({ from, to, orderId });
  }

  @ApiOperation({ summary: 'Issue report' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'orderId', required: false })
  @ApiResponse({ status: 200, description: 'Report' })
  @Get('reports/issues')
  @Roles('PRODUCTION_MANAGER', 'PRODUCTION_SUPERVISOR', 'QA_MANAGER', 'ADMIN')
  getIssueReport(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('orderId') orderId?: string,
  ) {
    return this.productionService.getIssueReport({ from, to, orderId });
  }

  @ApiOperation({ summary: 'Start a production stage' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'stageId' })
  @ApiResponse({ status: 200, description: 'Started' })
  @Post(':id/stages/:stageId/start')
  @Roles('PRODUCTION_SUPERVISOR', 'ADMIN')
  @UseGuards(AssignedOrderGuard, MaterialAvailabilityGuard, StageSequenceGuard)
  startStage(@Param('id') id: string, @Param('stageId') stageId: string) {
    return this.productionService.startStage(id, stageId);
  }

  @ApiOperation({ summary: 'Stop a running stage' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'stageId' })
  @ApiResponse({ status: 200, description: 'Stopped' })
  @Post(':id/stages/:stageId/stop')
  @Roles('PRODUCTION_SUPERVISOR', 'ADMIN')
  @UseGuards(AssignedOrderGuard)
  stopStage(@Param('id') id: string, @Param('stageId') stageId: string) {
    return this.productionService.stopStage(id, stageId);
  }

  @ApiOperation({ summary: 'Resume a paused stage' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'stageId' })
  @ApiResponse({ status: 200, description: 'Resumed' })
  @Post(':id/stages/:stageId/resume')
  @Roles('PRODUCTION_SUPERVISOR', 'ADMIN')
  @UseGuards(AssignedOrderGuard, StageSequenceGuard)
  resumeStage(@Param('id') id: string, @Param('stageId') stageId: string) {
    return this.productionService.resumeStage(id, stageId);
  }

  @ApiOperation({ summary: 'Submit a stage for QA review' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'stageId' })
  @ApiResponse({ status: 200, description: 'Submitted for QA' })
  @Post(':id/stages/:stageId/submit-for-qa')
  @Roles('PRODUCTION_SUPERVISOR', 'ADMIN')
  @UseGuards(AssignedOrderGuard)
  submitForQa(
    @Param('id') id: string,
    @Param('stageId') stageId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.productionService.submitForQa(
      id,
      stageId,
      getCurrentUserId(user),
    );
  }

  @ApiOperation({ summary: 'Complete a production stage' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'stageId' })
  @ApiResponse({ status: 200, description: 'Completed' })
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

  @ApiOperation({ summary: 'QA review for a stage' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'stageId' })
  @ApiBody({ type: QaReviewDto })
  @ApiResponse({ status: 200, description: 'Reviewed' })
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

  @ApiOperation({ summary: 'Record a QA inspection for a stage' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'stageId' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['result'],
      properties: {
        measurements: { type: 'string' },
        defects: { type: 'integer' },
        result: { type: 'string' },
        notes: { type: 'string' },
        status: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Inspection recorded' })
  @Post(':id/stages/:stageId/qa-inspection')
  @Roles('QA_STAFF', 'QA_MANAGER', 'ADMIN')
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

  @ApiOperation({ summary: 'Approve a QA inspection' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'stageId' })
  @ApiParam({ name: 'inspectionId' })
  @ApiResponse({ status: 200, description: 'Approved' })
  @Patch(':id/stages/:stageId/qa-inspection/:inspectionId/approve')
  @Roles('QA_STAFF', 'QA_MANAGER', 'ADMIN')
  approveInspection(
    @Param('id') id: string,
    @Param('stageId') stageId: string,
    @Param('inspectionId') inspectionId: string,
  ) {
    return this.productionService.approveInspection(id, stageId, inspectionId);
  }

  @ApiOperation({ summary: 'Reject a QA inspection' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'stageId' })
  @ApiParam({ name: 'inspectionId' })
  @ApiBody({ schema: { type: 'object', properties: { reason: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Rejected' })
  @Patch(':id/stages/:stageId/qa-inspection/:inspectionId/reject')
  @Roles('QA_STAFF', 'QA_MANAGER', 'ADMIN')
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

  @ApiOperation({ summary: 'Record production output' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: RecordOutputDto })
  @ApiResponse({ status: 201, description: 'Recorded' })
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

  @ApiOperation({ summary: 'Get output history for an order' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Output history' })
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

  @ApiOperation({ summary: 'Stage output report for an order' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Report' })
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

  @ApiOperation({ summary: 'Report a production issue' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: ReportIssueDto })
  @ApiResponse({ status: 201, description: 'Issue reported' })
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

  @ApiOperation({ summary: 'List issues for an order' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Issues' })
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

  @ApiOperation({ summary: 'Record a quality inspection for a stage' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'stageId' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['result'],
      properties: {
        measurements: { type: 'string' },
        defects: { type: 'integer' },
        result: { type: 'string' },
        notes: { type: 'string' },
        status: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Inspection recorded' })
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

  @ApiOperation({ summary: 'List all QA inspections' })
  @ApiResponse({ status: 200, description: 'Inspections' })
  @Get('qa/inspections')
  @Roles('QA_STAFF', 'QA_MANAGER', 'ADMIN')
  getAllInspections() {
    return this.productionService.listInspections();
  }

  @ApiOperation({ summary: 'List inspections for an order' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Inspections' })
  @Get(':id/qa/inspections')
  @Roles('QA_STAFF', 'QA_MANAGER', 'ADMIN')
  @UseGuards(AssignedOrderGuard)
  getOrderInspections(@Param('id') id: string) {
    return this.productionService.listInspections(id);
  }

  @ApiOperation({ summary: 'List quality thresholds' })
  @ApiResponse({ status: 200, description: 'Thresholds' })
  @Get('qa/thresholds')
  @Roles('QA_MANAGER', 'ADMIN')
  getQualityThresholds() {
    return this.productionService.getQualityThresholds();
  }

  @ApiOperation({ summary: 'Upsert quality threshold for a stage' })
  @ApiParam({ name: 'stageName', enum: ProductionStageName })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['maxDefectsPerHundred', 'acceptanceCriteria'],
      properties: {
        maxDefectsPerHundred: { type: 'integer' },
        acceptanceCriteria: { type: 'string' },
        isActive: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Saved' })
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

  @ApiOperation({ summary: 'QA dashboard' })
  @ApiResponse({ status: 200, description: 'Dashboard metrics' })
  @Get('qa/dashboard')
  @Roles('QA_MANAGER', 'ADMIN')
  getQualityDashboard() {
    return this.productionService.getQualityDashboard();
  }

  @ApiOperation({ summary: 'Update issue status' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'issueId' })
  @ApiBody({ schema: { type: 'object', properties: { status: { enum: Object.values(ProductionIssueStatus) } } } })
  @ApiResponse({ status: 200, description: 'Updated' })
  @Patch(':id/issues/:issueId')
  @Roles('QA_MANAGER', 'PRODUCTION_MANAGER', 'ADMIN')
  updateIssueStatus(
    @Param('id') id: string,
    @Param('issueId') issueId: string,
    @Body('status') status: ProductionIssueStatus,
  ) {
    return this.productionService.updateIssueStatus(issueId, status);
  }
}
