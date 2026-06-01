import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { ProductionOrderStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('production-orders')
@ApiBearerAuth('jwt')
@Controller('production/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @ApiOperation({ summary: 'List production orders (legacy endpoint)' })
  @ApiResponse({ status: 200, description: 'Array of orders' })
  @Get()
  @Roles('PRODUCTION_MANAGER', 'PRODUCTION_SUPERVISOR', 'MANAGER', 'ADMIN')
  findAll(@CurrentUser() user: { userId: string; roles: string[] }) {
    return this.ordersService.findAll(user);
  }

  @ApiOperation({ summary: 'Create a production order (legacy endpoint)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['orderNumber', 'productName', 'productCode', 'quantity', 'deadline'],
      properties: {
        orderNumber: { type: 'string' },
        productName: { type: 'string' },
        productCode: { type: 'string' },
        quantity: { type: 'integer' },
        deadline: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Created' })
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

  @ApiOperation({ summary: 'Update production order status' })
  @ApiParam({ name: 'id' })
  @ApiBody({ schema: { type: 'object', properties: { status: { enum: Object.values(ProductionOrderStatus) } } } })
  @ApiResponse({ status: 200, description: 'Updated' })
  @Put(':id/status')
  @Roles('PRODUCTION_MANAGER', 'ADMIN')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: ProductionOrderStatus,
  ) {
    return this.ordersService.updateStatus(id, status);
  }
}
