import { Module } from '@nestjs/common';
import { ProductionOrdersController } from './production.controller';
import { ProductionService } from './production.service';
import { MailModule } from '../mail/mail.module';
import { AssignedOrderGuard } from './guards/assigned-order.guard';
import { MaterialAvailabilityGuard } from './guards/material-availability.guard';
import { QAApprovalGuard } from './guards/qa-approval.guard';
import { StageSequenceGuard } from './guards/stage-sequence.guard';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [MailModule, NotificationsModule],
  controllers: [ProductionOrdersController],
  providers: [
    ProductionService,
    AssignedOrderGuard,
    MaterialAvailabilityGuard,
    QAApprovalGuard,
    StageSequenceGuard,
  ],
  exports: [ProductionService],
})
export class ProductionModule {}
