import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductionOrderStatus } from '@prisma/client';
import { BomItemDto } from './create-production-order.dto';

export class UpdateProductionOrderDto {
  @ApiPropertyOptional()
  productName?: string;

  @ApiPropertyOptional()
  productCode?: string;

  @ApiPropertyOptional()
  targetQuantity?: number;

  @ApiPropertyOptional()
  deadline?: string;

  @ApiPropertyOptional()
  assignedSupervisorId?: string;

  @ApiPropertyOptional({ type: [BomItemDto] })
  bomItems?: BomItemDto[];

  @ApiPropertyOptional({ enum: ProductionOrderStatus })
  status?: ProductionOrderStatus;
}
