import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { StagesController } from './stages.controller';
import { StagesService } from './stages.service';

@Module({
  controllers: [OrdersController, StagesController],
  providers: [OrdersService, StagesService],
  exports: [OrdersService, StagesService],
})
export class ProductionModule {}
