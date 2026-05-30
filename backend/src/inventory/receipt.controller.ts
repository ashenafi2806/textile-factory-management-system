import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleType } from '@prisma/client';
import { ReceiptService } from './receipt.service';
import { CreateInventoryReceiptDto } from './dto/create-inventory-receipt.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('inventory/receipts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReceiptController {
  constructor(private readonly receiptService: ReceiptService) {}

  @Post()
  @Roles(RoleType.STOREKEEPER, RoleType.ADMIN)
  create(
    @Body() dto: CreateInventoryReceiptDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.receiptService.create(dto, user.id);
  }

  @Get()
  @Roles(RoleType.STOREKEEPER, RoleType.MANAGER, RoleType.ADMIN)
  findAll(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.receiptService.findAll({ startDate, endDate });
  }
}
