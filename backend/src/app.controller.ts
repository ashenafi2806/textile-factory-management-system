import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AppService } from './app.service';
import { ProductionOrderService } from './production-order.service';

@Controller('api')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly productionOrderService: ProductionOrderService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/production')
  createProductionOrder(@Body() productionOrder: any): string {
    return this.productionOrderService.createProductionOrder(productionOrder);
  }

  @Get('/production/:id')
  getProductionOrder(@Param('id') id: string): any {
    return this.productionOrderService.getProductionOrder(id);
  }
}
