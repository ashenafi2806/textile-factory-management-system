import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RequisitionService } from './requisition.service';

@Module({
  imports: [PrismaModule],
  controllers: [InventoryController],
  providers: [InventoryService, RequisitionService],
  exports: [InventoryService],
})
export class InventoryModule {}
