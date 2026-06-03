import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
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
import { InventoryCategory, RoleType, TransactionType } from '@prisma/client';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { RestockItemDto } from './dto/restock-item.dto';
import { IssueStockDto } from './dto/issue-stock.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { CreateRequisitionDto } from './dto/create-requisition.dto';
import { ReturnStockDto } from './dto/return-stock.dto';
import { RequisitionService } from './requisition.service';

@ApiTags('inventory')
@ApiBearerAuth('jwt')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly requisitionService: RequisitionService,
  ) {}

  @ApiOperation({ summary: 'Create an inventory item' })
  @ApiBody({ type: CreateInventoryItemDto })
  @ApiResponse({ status: 201, description: 'Created' })
  @Post('items')
  @Roles(RoleType.STOREKEEPER, RoleType.ADMIN)
  createItem(@Body() dto: CreateInventoryItemDto) {
    return this.inventoryService.createItem(dto);
  }

  @ApiOperation({ summary: 'List inventory items with filters' })
  @ApiQuery({ name: 'category', required: false, enum: InventoryCategory })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Paginated list' })
  @Get('items')
  @Roles(
    RoleType.STOREKEEPER,
    RoleType.MANAGER,
    RoleType.PRODUCTION_MANAGER,
    RoleType.PRODUCTION_SUPERVISOR,
    RoleType.MAINTENANCE_MANAGER,
    RoleType.MAINTENANCE_TECHNICIAN,
    RoleType.ADMIN,
  )
  findAll(
    @Query('category') category?: InventoryCategory,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.findAll({
      category,
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @ApiOperation({ summary: 'Get an inventory item by ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Item' })
  @Get('items/:id')
  @Roles(
    RoleType.STOREKEEPER,
    RoleType.MANAGER,
    RoleType.PRODUCTION_MANAGER,
    RoleType.PRODUCTION_SUPERVISOR,
    RoleType.MAINTENANCE_MANAGER,
    RoleType.MAINTENANCE_TECHNICIAN,
    RoleType.ADMIN,
  )
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.findOne(id);
  }

  @ApiOperation({ summary: 'Update an inventory item' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateInventoryItemDto })
  @ApiResponse({ status: 200, description: 'Updated' })
  @Patch('items/:id')
  @Roles(RoleType.STOREKEEPER, RoleType.ADMIN)
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInventoryItemDto,
  ) {
    return this.inventoryService.updateItem(id, dto);
  }

  @ApiOperation({ summary: 'Restock an item (add quantity)' })
  @ApiBody({ type: RestockItemDto })
  @ApiResponse({ status: 201, description: 'Stock added' })
  @Post('restock')
  @Roles(RoleType.STOREKEEPER, RoleType.ADMIN)
  addStock(@Body() dto: RestockItemDto, @CurrentUser() user: { id: string }) {
    return this.inventoryService.addStock(dto, user.id);
  }

  @ApiOperation({ summary: 'Issue stock out of inventory' })
  @ApiBody({ type: IssueStockDto })
  @ApiResponse({ status: 201, description: 'Stock issued' })
  @Post('issue')
  @Roles(RoleType.STOREKEEPER, RoleType.ADMIN)
  issueStock(@Body() dto: IssueStockDto, @CurrentUser() user: { id: string }) {
    return this.inventoryService.issueStock(dto, user.id);
  }

  @ApiOperation({ summary: 'Adjust stock (positive or negative)' })
  @ApiBody({ type: AdjustStockDto })
  @ApiResponse({ status: 201, description: 'Adjusted' })
  @Post('adjust')
  @Roles(RoleType.STOREKEEPER, RoleType.ADMIN)
  adjustStock(
    @Body() dto: AdjustStockDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.inventoryService.adjustStock(dto, user.id);
  }

  @ApiOperation({ summary: 'Return previously issued stock' })
  @ApiBody({ type: ReturnStockDto })
  @ApiResponse({ status: 201, description: 'Returned' })
  @Post('return')
  @Roles(RoleType.STOREKEEPER, RoleType.ADMIN)
  returnStock(
    @Body() dto: ReturnStockDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.inventoryService.returnStock(
      {
        itemId: dto.itemId,
        quantity: dto.quantity,
        referenceTransactionId: dto.referenceTransactionId,
        note: dto.note,
      },
      user.id,
    );
  }

  @ApiOperation({ summary: 'Low-stock alerts' })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: InventoryCategory,
    description:
      'Optional category filter. Use SPARE_PART for machine spare-part reorder alerts.',
  })
  @ApiResponse({ status: 200, description: 'Array of low-stock items' })
  @Get('alerts')
  @Roles(
    RoleType.STOREKEEPER,
    RoleType.MANAGER,
    RoleType.PRODUCTION_MANAGER,
    RoleType.PRODUCTION_SUPERVISOR,
    RoleType.MAINTENANCE_MANAGER,
    RoleType.ADMIN,
  )
  getAlerts(@Query('category') category?: InventoryCategory) {
    return this.inventoryService.getAlerts({ category });
  }

  @ApiOperation({
    summary:
      'Export low-stock alerts as CSV (for management review and reorder submissions)',
  })
  @ApiQuery({ name: 'category', required: false, enum: InventoryCategory })
  @ApiResponse({ status: 200, description: 'CSV file' })
  @Get('alerts/export')
  @Roles(
    RoleType.STOREKEEPER,
    RoleType.MANAGER,
    RoleType.PRODUCTION_MANAGER,
    RoleType.MAINTENANCE_MANAGER,
    RoleType.ADMIN,
  )
  @Header('content-type', 'text/csv; charset=utf-8')
  @Header(
    'content-disposition',
    'attachment; filename="reorder-alerts.csv"',
  )
  async exportAlertsCsv(
    @Query('category') category: InventoryCategory | undefined,
    @Res() res: any,
  ) {
    const csv = await this.inventoryService.exportAlertsCsv({ category });
    res.send(csv);
  }

  @ApiOperation({ summary: 'List inventory transactions' })
  @ApiQuery({ name: 'itemId', required: false })
  @ApiQuery({ name: 'type', required: false, enum: TransactionType })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Paginated list' })
  @Get('transactions')
  @Roles(
    RoleType.STOREKEEPER,
    RoleType.MANAGER,
    RoleType.PRODUCTION_MANAGER,
    RoleType.PRODUCTION_SUPERVISOR,
    RoleType.MAINTENANCE_MANAGER,
    RoleType.ADMIN,
  )
  getTransactions(
    @Query('itemId') itemId?: string,
    @Query('type') type?: TransactionType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.getTransactions({
      itemId,
      type,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @ApiOperation({ summary: 'Inventory summary counts and totals' })
  @ApiResponse({ status: 200, description: 'Summary' })
  @Get('summary')
  @Roles(
    RoleType.STOREKEEPER,
    RoleType.MANAGER,
    RoleType.PRODUCTION_MANAGER,
    RoleType.ADMIN,
  )
  getSummary() {
    return this.inventoryService.getSummary();
  }

  @ApiOperation({ summary: 'Inventory valuation' })
  @ApiResponse({ status: 200, description: 'Valuation' })
  @Get('valuation')
  @Roles(
    RoleType.STOREKEEPER,
    RoleType.MANAGER,
    RoleType.PRODUCTION_MANAGER,
    RoleType.ADMIN,
  )
  getValuation() {
    return this.inventoryService.getValuation();
  }

  @ApiOperation({ summary: 'Aging report' })
  @ApiResponse({ status: 200, description: 'Aging buckets' })
  @Get('aging')
  @Roles(
    RoleType.STOREKEEPER,
    RoleType.MANAGER,
    RoleType.PRODUCTION_MANAGER,
    RoleType.ADMIN,
  )
  getAgingReport() {
    return this.inventoryService.getAgingReport();
  }

  @ApiOperation({ summary: 'Consumption analysis' })
  @ApiQuery({ name: 'days', required: false, example: 30 })
  @ApiResponse({ status: 200, description: 'Consumption stats' })
  @Get('consumption')
  @Roles(
    RoleType.STOREKEEPER,
    RoleType.MANAGER,
    RoleType.PRODUCTION_MANAGER,
    RoleType.ADMIN,
  )
  getConsumption(@Query('days') days?: string) {
    const d = days ? Number(days) : 30;
    return this.inventoryService.getConsumptionAnalysis(d);
  }

  @ApiOperation({ summary: 'Create a requisition for stock issuance' })
  @ApiBody({ type: CreateRequisitionDto })
  @ApiResponse({ status: 201, description: 'Requisition created' })
  @Post('requisitions')
  @Roles(
    RoleType.SUPERVISOR,
    RoleType.MANAGER,
    RoleType.MAINTENANCE_MANAGER,
    RoleType.MAINTENANCE_TECHNICIAN,
    RoleType.PRODUCTION_MANAGER,
    RoleType.PRODUCTION_SUPERVISOR,
    RoleType.ADMIN,
  )
  createRequisition(
    @Body() dto: CreateRequisitionDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.requisitionService.create(dto, user.id);
  }

  @ApiOperation({ summary: 'List requisitions' })
  @ApiResponse({ status: 200, description: 'Array of requisitions' })
  @Get('requisitions')
  @Roles(
    RoleType.MANAGER,
    RoleType.ADMIN,
    RoleType.SUPERVISOR,
    RoleType.MAINTENANCE_MANAGER,
    RoleType.PRODUCTION_MANAGER,
    RoleType.PRODUCTION_SUPERVISOR,
  )
  findRequisitions(@CurrentUser() user: { id: string; roles: string[] }) {
    return this.requisitionService.findAll(user);
  }

  @ApiOperation({ summary: 'Approve a requisition' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Approved' })
  @Patch('requisitions/:id/approve')
  @Roles(
    RoleType.MANAGER,
    RoleType.ADMIN,
    RoleType.PRODUCTION_MANAGER,
    RoleType.MAINTENANCE_MANAGER,
  )
  approveRequisition(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.requisitionService.approve(id, user.id);
  }

  @ApiOperation({ summary: 'Reject a requisition' })
  @ApiParam({ name: 'id' })
  @ApiBody({
    schema: { type: 'object', properties: { reason: { type: 'string' } } },
  })
  @ApiResponse({ status: 200, description: 'Rejected' })
  @Patch('requisitions/:id/reject')
  @Roles(RoleType.MANAGER, RoleType.ADMIN, RoleType.MAINTENANCE_MANAGER)
  rejectRequisition(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.requisitionService.reject(id, user.id, reason);
  }
}
