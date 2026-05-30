import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { ProductionOrderStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('production/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  @Roles('PRODUCTION_MANAGER', 'PRODUCTION_SUPERVISOR', 'MANAGER', 'ADMIN')
  findAll(@CurrentUser() user: { userId: string; roles: string[] }) {
    return this.ordersService.findAll(user);
  }

  @Post()
  @Roles('PRODUCTION_MANAGER', 'MANAGER', 'ADMIN')
  create(
    @Body()
    data: {
      orderNumber: string;
      productName: string;
      productCode: string;
      quantity: number;
      deadline: string;
    },
    @CurrentUser() user: { userId: string },
  ) {
    return this.ordersService.createOrder({
      ...data,
      createdByManagerId: user.userId,
    });
  }

  @Put(':id/status')
  @Roles('PRODUCTION_MANAGER', 'ADMIN')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: ProductionOrderStatus,
  ) {
    return this.ordersService.updateStatus(id, status);
  }
}
