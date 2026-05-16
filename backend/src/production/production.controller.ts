// import {
//   Body,
//   Controller,
//   Delete,
//   Get,
//   Param,
//   Patch,
//   Post,
//   UseGuards,
// } from '@nestjs/common';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { Roles } from '../auth/decorators/roles.decorator';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { AssignedOrderGuard } from './guards/assigned-order.guard';
// import { MaterialAvailabilityGuard } from './guards/material-availability.guard';
// import { QAApprovalGuard } from './guards/qa-approval.guard';
// import { StageSequenceGuard } from './guards/stage-sequence.guard';
// import { CurrentUser } from '../auth/decorators/current-user.decorator';
// import {
//   ProductionIssuePriority,
//   ProductionIssueStatus,
//   ProductionIssueType,
//   ProductionOrderStatus,
//   ProductionStageStatus,
// } from '@prisma/client';
// import { ProductionService } from './production.service';

// @Controller('production-orders')
// @UseGuards(JwtAuthGuard, RolesGuard)
// export class ProductionController {
//   constructor(private readonly productionService: ProductionService) {}

//   @Get()
//   @Roles('PRODUCTION_MANAGER', 'PRODUCTION_SUPERVISOR', 'ADMIN')
//   listOrders(@CurrentUser() user: any) {
//     return this.productionService.listOrders(user);
//   }

//   @Post()
//   @Roles('PRODUCTION_MANAGER', 'ADMIN')
//   createOrder(@Body() body: any, @CurrentUser() user: any) {
//     return this.productionService.createOrder({
//       ...body,
//       createdByManagerId: user.userId,
//     });
//   }

//   @Get(':id')
//   @UseGuards(AssignedOrderGuard)
//   @Roles(
//     'PRODUCTION_MANAGER',
//     'PRODUCTION_SUPERVISOR',
//     'QA_MANAGER',
//     'QA_STAFF',
//     'STOREKEEPER',
//     'ADMIN',
//   )
//   getOrder(@Param('id') id: string) {
//     return this.productionService.getOrderById(id);
//   }

//   @Patch(':id')
//   @Roles('PRODUCTION_MANAGER', 'ADMIN')
//   updateOrder(@Param('id') id: string, @Body() body: any) {
//     return this.productionService.updateOrder(id, body);
//   }

//   @Delete(':id')
//   @Roles('PRODUCTION_MANAGER', 'ADMIN')
//   cancelOrder(@Param('id') id: string) {
//     return this.productionService.cancelOrder(id);
//   }

//   @Post(':id/assign')
//   @Roles('PRODUCTION_MANAGER', 'ADMIN')
//   assignSupervisor(
//     @Param('id') id: string,
//     @Body('supervisorId') supervisorId: string,
//   ) {
//     return this.productionService.assignSupervisor(id, supervisorId);
//   }

//   @Get(':id/material-check')
//   @Roles('PRODUCTION_MANAGER', 'PRODUCTION_SUPERVISOR', 'STOREKEEPER', 'ADMIN')
//   checkMaterial(@Param('id') id: string) {
//     return this.productionService.checkMaterial(id);
//   }

//   @Post(':id/stages/:stageId/start')
//   @UseGuards(AssignedOrderGuard, MaterialAvailabilityGuard, StageSequenceGuard)
//   @Roles('PRODUCTION_SUPERVISOR', 'ADMIN')
//   startStage(@Param('id') id: string, @Param('stageId') stageId: string) {
//     return this.productionService.startStage(id, stageId);
//   }

//   @Post(':id/stages/:stageId/stop')
//   @UseGuards(AssignedOrderGuard)
//   @Roles('PRODUCTION_SUPERVISOR', 'ADMIN')
//   stopStage(@Param('id') id: string, @Param('stageId') stageId: string) {
//     return this.productionService.stopStage(id, stageId);
//   }

//   @Post(':id/stages/:stageId/resume')
//   @UseGuards(AssignedOrderGuard, StageSequenceGuard)
//   @Roles('PRODUCTION_SUPERVISOR', 'ADMIN')
//   resumeStage(@Param('id') id: string, @Param('stageId') stageId: string) {
//     return this.productionService.resumeStage(id, stageId);
//   }

//   @Post(':id/stages/:stageId/complete')
//   @UseGuards(AssignedOrderGuard)
//   @Roles('PRODUCTION_SUPERVISOR', 'ADMIN')
//   completeStage(@Param('id') id: string, @Param('stageId') stageId: string) {
//     return this.productionService.completeStage(id, stageId);
//   }

//   @Post(':id/stages/:stageId/qa-review')
//   @UseGuards(QAApprovalGuard)
//   @Roles('QA_STAFF', 'QA_MANAGER', 'ADMIN')
//   qaReview(
//     @Param('id') id: string,
//     @Param('stageId') stageId: string,
//     @Body('action') action: 'APPROVE' | 'REJECT',
//   ) {
//     return this.productionService.qaReview(id, stageId, action);
//   }

//   @Post(':id/output')
//   @UseGuards(AssignedOrderGuard)
//   @Roles('PRODUCTION_SUPERVISOR', 'ADMIN')
//   recordOutput(
//     @Param('id') id: string,
//     @Body() body: any,
//     @CurrentUser() user: any,
//   ) {
//     return this.productionService.recordOutput({
//       productionOrderId: id,
//       stageId: body.stageId,
//       supervisorId: user.userId,
//       shiftDate: body.shiftDate,
//       goodQuantity: body.goodQuantity,
//       defectiveQuantity: body.defectiveQuantity,
//       notes: body.notes,
//     });
//   }

//   @Get(':id/output')
//   @UseGuards(AssignedOrderGuard)
//   @Roles(
//     'PRODUCTION_MANAGER',
//     'PRODUCTION_SUPERVISOR',
//     'QA_MANAGER',
//     'QA_STAFF',
//     'ADMIN',
//   )
//   getOutputHistory(@Param('id') id: string) {
//     return this.productionService.getOutputHistory(id);
//   }

//   @Post(':id/issues')
//   @UseGuards(AssignedOrderGuard)
//   @Roles(
//     'PRODUCTION_SUPERVISOR',
//     'QA_STAFF',
//     'QA_MANAGER',
//     'PRODUCTION_MANAGER',
//     'ADMIN',
//   )
//   reportIssue(
//     @Param('id') id: string,
//     @Body() body: any,
//     @CurrentUser() user: any,
//   ) {
//     return this.productionService.createIssue({
//       productionOrderId: id,
//       stageId: body.stageId,
//       reportedById: user.userId,
//       issueType: body.issueType as ProductionIssueType,
//       description: body.description,
//       priority: body.priority as ProductionIssuePriority,
//     });
//   }

//   @Get(':id/issues')
//   @UseGuards(AssignedOrderGuard)
//   @Roles(
//     'PRODUCTION_MANAGER',
//     'PRODUCTION_SUPERVISOR',
//     'QA_MANAGER',
//     'QA_STAFF',
//     'ADMIN',
//   )
//   getIssues(@Param('id') id: string) {
//     return this.productionService.getIssues(id);
//   }

//   @Patch(':id/issues/:issueId')
//   @Roles('QA_MANAGER', 'PRODUCTION_MANAGER', 'ADMIN')
//   updateIssueStatus(
//     @Param('id') id: string,
//     @Param('issueId') issueId: string,
//     @Body('status') status: ProductionIssueStatus,
//   ) {
//     return this.productionService.updateIssueStatus(issueId, status);
//   }

//   @Get('reports/summary')
//   @Roles('PRODUCTION_MANAGER', 'ADMIN')
//   getSummaryReport() {
//     return this.productionService.getSummaryReport();
//   }

//   @Get('reports/performance')
//   @Roles('PRODUCTION_MANAGER', 'ADMIN')
//   getPerformanceReport() {
//     return this.productionService.getPerformanceReport();
//   }

//   // Removed old legacy endpoints now handled by new REST routes above
// }





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
import {
  ProductionIssuePriority,
  ProductionIssueStatus,
  ProductionIssueType,
} from '@prisma/client';
import { ProductionService } from './production.service';
import { CreateProductionOrderDto } from './dto/create-production-order.dto';
import { UpdateProductionOrderDto } from './dto/update-production-order.dto';
import { RecordOutputDto } from './dto/record-output.dto';
import { ReportIssueDto } from './dto/report-issue.dto';
import { QaReviewDto } from './dto/qa-review.dto';

@Controller('production-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductionOrdersController {
  constructor(
    // private readonly ordersService: ProductionOrdersService,
    // private readonly stagesService: ProductionStagesService,
    // private readonly outputService: ProductionOutputService,
    // private readonly issuesService: ProductionIssuesService,
    private readonly productionService: ProductionService,
  ) {}

  // ============= ORDER MANAGEMENT =============

  @Post()
  @Roles('PRODUCTION_MANAGER', 'ADMIN')
  createOrder(
    @Body() body: CreateProductionOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.createOrder(body, user.userId);
  }

  @Get()
  @Roles('PRODUCTION_MANAGER', 'PRODUCTION_SUPERVISOR', 'ADMIN')
  listOrders(@CurrentUser() user: any) {
    return this.ordersService.listOrders(user);
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
  )
  getOrder(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  @Patch(':id')
  @Roles('PRODUCTION_MANAGER', 'ADMIN')
  updateOrder(
    @Param('id') id: string,
    @Body() body: UpdateProductionOrderDto,
  ) {
    return this.ordersService.updateOrder(id, body);
  }

  @Delete(':id')
  @Roles('PRODUCTION_MANAGER', 'ADMIN')
  cancelOrder(@Param('id') id: string) {
    return this.ordersService.cancelOrder(id);
  }

  @Post(':id/assign')
  @Roles('PRODUCTION_MANAGER', 'ADMIN')
  assignSupervisor(
    @Param('id') id: string,
    @Body('supervisorId') supervisorId: string,
  ) {
    return this.ordersService.assignSupervisor(id, supervisorId);
  }

  // ============= MATERIAL MANAGEMENT =============

  @Get(':id/material-check')
  @Roles('PRODUCTION_MANAGER', 'PRODUCTION_SUPERVISOR', 'STOREKEEPER', 'ADMIN')
  @UseGuards(MaterialAvailabilityGuard)
  checkMaterial(@Param('id') id: string) {
    return this.ordersService.checkMaterial(id);
  }

  // ============= STAGE MANAGEMENT =============

  @Post(':id/stages/:stageId/start')
  @Roles('PRODUCTION_SUPERVISOR', 'ADMIN')
  @UseGuards(AssignedOrderGuard, MaterialAvailabilityGuard, StageSequenceGuard)
  startStage(@Param('id') id: string, @Param('stageId') stageId: string) {
    return this.stagesService.startStage(id, stageId);
  }

  @Post(':id/stages/:stageId/stop')
  @Roles('PRODUCTION_SUPERVISOR', 'ADMIN')
  @UseGuards(AssignedOrderGuard)
  stopStage(@Param('id') id: string, @Param('stageId') stageId: string) {
    return this.stagesService.stopStage(id, stageId);
  }

  @Post(':id/stages/:stageId/resume')
  @Roles('PRODUCTION_SUPERVISOR', 'ADMIN')
  @UseGuards(AssignedOrderGuard, StageSequenceGuard)
  resumeStage(@Param('id') id: string, @Param('stageId') stageId: string) {
    return this.stagesService.resumeStage(id, stageId);
  }

  @Post(':id/stages/:stageId/complete')
  @Roles('PRODUCTION_SUPERVISOR', 'ADMIN')
  @UseGuards(AssignedOrderGuard)
  completeStage(@Param('id') id: string, @Param('stageId') stageId: string) {
    return this.stagesService.completeStage(id, stageId);
  }

  // ============= QA MANAGEMENT =============

  @Post(':id/stages/:stageId/qa-review')
  @Roles('QA_STAFF', 'QA_MANAGER', 'ADMIN')
  @UseGuards(QAApprovalGuard)
  qaReview(
    @Param('id') id: string,
    @Param('stageId') stageId: string,
    @Body() body: QaReviewDto,
  ) {
    return this.stagesService.qaReview(id, stageId, body.action);
  }

  // ============= OUTPUT MANAGEMENT =============

  @Post(':id/output')
  @Roles('PRODUCTION_SUPERVISOR', 'ADMIN')
  @UseGuards(AssignedOrderGuard)
  recordOutput(
    @Param('id') id: string,
    @Body() body: RecordOutputDto,
    @CurrentUser() user: any,
  ) {
    return this.outputService.recordOutput(id, body, user.userId);
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
    return this.outputService.getOutputHistory(id);
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
    @CurrentUser() user: any,
  ) {
    return this.issuesService.reportIssue(id, body, user.userId);
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
    return this.issuesService.getIssues(id);
  }

  @Patch(':id/issues/:issueId')
  @Roles('QA_MANAGER', 'PRODUCTION_MANAGER', 'ADMIN')
  updateIssueStatus(
    @Param('id') id: string,
    @Param('issueId') issueId: string,
    @Body('status') status: ProductionIssueStatus,
  ) {
    return this.issuesService.updateIssueStatus(issueId, status);
  }

  // ============= REPORTS =============

  @Get('reports/summary')
  @Roles('PRODUCTION_MANAGER', 'ADMIN')
  getSummaryReport() {
    return this.ordersService.getSummaryReport();
  }

  @Get('reports/performance')
  @Roles('PRODUCTION_MANAGER', 'ADMIN')
  getPerformanceReport() {
    return this.ordersService.getPerformanceReport();
  }
}