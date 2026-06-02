import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { ReceiptController } from './receipt.controller';
import { ReceiptService } from './receipt.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RequisitionService } from './requisition.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [InventoryController, ReceiptController],
  providers: [InventoryService, RequisitionService, ReceiptService],
  exports: [InventoryService, ReceiptService],
})
export class InventoryModule {}
