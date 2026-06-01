import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleType } from '@prisma/client';
import { ReceiptService } from './receipt.service';
import { CreateInventoryReceiptDto } from './dto/create-inventory-receipt.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('inventory/receipts')
@ApiBearerAuth('jwt')
@Controller('inventory/receipts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReceiptController {
  constructor(private readonly receiptService: ReceiptService) {}

  @ApiOperation({ summary: 'Create an inventory receipt (incoming stock)' })
  @ApiBody({ type: CreateInventoryReceiptDto })
  @ApiResponse({ status: 201, description: 'Receipt created' })
  @Post()
  @Roles(RoleType.STOREKEEPER, RoleType.ADMIN)
  create(
    @Body() dto: CreateInventoryReceiptDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.receiptService.create(dto, user.id);
  }

  @ApiOperation({ summary: 'List inventory receipts' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'Array of receipts' })
  @Get()
  @Roles(RoleType.STOREKEEPER, RoleType.MANAGER, RoleType.ADMIN)
  findAll(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.receiptService.findAll({ startDate, endDate });
  }
}
