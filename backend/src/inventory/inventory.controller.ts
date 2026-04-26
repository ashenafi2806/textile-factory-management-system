import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get()
  @Roles('STOREKEEPER', 'MANAGER', 'PRODUCTION_MANAGER', 'ADMIN')
  findAll() {
    return this.inventoryService.findAll();
  }

  @Post()
  @Roles('STOREKEEPER', 'ADMIN')
  create(@Body() data: any) {
    return this.inventoryService.createItem(data);
  }

  @Post('transaction')
  @Roles('STOREKEEPER', 'PRODUCTION_SUPERVISOR', 'MAINTENANCE_TECHNICIAN', 'ADMIN')
  recordTransaction(@Body() data: any, @CurrentUser() user: any) {
    return this.inventoryService.recordTransaction({
      ...data,
      performedById: user.id,
    });
  }

  @Get('alerts')
  @Roles('STOREKEEPER', 'MANAGER', 'ADMIN')
  getAlerts() {
    return this.inventoryService.getLowStockAlerts();
  }
}
