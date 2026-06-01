import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInventoryReceiptItemDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  itemId!: string;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @IsPositive()
  quantity!: number;

  @ApiPropertyOptional({ example: 12.5 })
  @IsOptional()
  @IsNumber()
  unitPrice?: number;
}
