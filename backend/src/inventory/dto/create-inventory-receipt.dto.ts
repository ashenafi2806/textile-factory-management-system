import { CreateInventoryReceiptItemDto } from './create-inventory-receipt-item.dto';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInventoryReceiptDto {
  @IsNotEmpty()
  supplierName: string;

  @IsOptional()
  batchNumber?: string;

  @IsDateString()
  purchaseDate: string; // ISO date string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInventoryReceiptItemDto)
  items: CreateInventoryReceiptItemDto[];
}
