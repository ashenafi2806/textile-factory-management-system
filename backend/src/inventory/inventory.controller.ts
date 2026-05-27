import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('items')
  @Roles(RoleType.STOREKEEPER, RoleType.ADMIN)
  createItem(@Body() dto: CreateInventoryItemDto) {
    return this.inventoryService.createItem(dto);
  }

  @Get('items')
  @Roles(
    RoleType.STOREKEEPER,
    RoleType.MANAGER,
    RoleType.PRODUCTION_MANAGER,
    RoleType.MAINTENANCE_MANAGER,
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

  @Get('items/:id')
  @Roles(
    RoleType.STOREKEEPER,
    RoleType.MANAGER,
    RoleType.PRODUCTION_MANAGER,
    RoleType.MAINTENANCE_MANAGER,
    RoleType.ADMIN,
  )
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.findOne(id);
  }

  @Patch('items/:id')
  @Roles(RoleType.STOREKEEPER, RoleType.ADMIN)
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInventoryItemDto,
  ) {
    return this.inventoryService.updateItem(id, dto);
  }

  @Post('restock')
  @Roles(RoleType.STOREKEEPER, RoleType.ADMIN)
  addStock(@Body() dto: RestockItemDto, @CurrentUser() user: { id: string }) {
    return this.inventoryService.addStock(dto, user.id);
  }

  @Post('issue')
  @Roles(RoleType.STOREKEEPER, RoleType.ADMIN)
  issueStock(@Body() dto: IssueStockDto, @CurrentUser() user: { id: string }) {
    return this.inventoryService.issueStock(dto, user.id);
  }

  @Post('adjust')
  @Roles(RoleType.STOREKEEPER, RoleType.ADMIN)
  adjustStock(
    @Body() dto: AdjustStockDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.inventoryService.adjustStock(dto, user.id);
  }

  @Get('alerts')
  @Roles(
    RoleType.STOREKEEPER,
    RoleType.MANAGER,
    RoleType.PRODUCTION_MANAGER,
    RoleType.MAINTENANCE_MANAGER,
    RoleType.ADMIN,
  )
  getAlerts() {
    return this.inventoryService.getAlerts();
  }

  @Get('transactions')
  @Roles(RoleType.STOREKEEPER, RoleType.MANAGER, RoleType.ADMIN)
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
}
