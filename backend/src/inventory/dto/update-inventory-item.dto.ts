import { PartialType } from '@nestjs/mapped-types';
import { CreateInventoryItemDto } from './create-inventory-item.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateInventoryItemDto extends PartialType(
  CreateInventoryItemDto,
) {
  @ApiPropertyOptional({ example: 'COT-001' })
  sku?: string;
}
