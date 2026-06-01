import { CreateInventoryReceiptItemDto } from './create-inventory-receipt-item.dto';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInventoryReceiptDto {
  @ApiProperty({ example: 'Acme Textiles' })
  @IsNotEmpty()
  supplierName!: string;

  @ApiPropertyOptional({ example: 'BATCH-001' })
  @IsOptional()
  batchNumber?: string;

  @ApiProperty({ example: '2026-06-01' })
  @IsDateString()
  purchaseDate!: string;

  @ApiProperty({ type: [CreateInventoryReceiptItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInventoryReceiptItemDto)
  items!: CreateInventoryReceiptItemDto[];
}
