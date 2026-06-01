import { InventoryCategory } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInventoryItemDto {
  @ApiProperty({ example: 'Cotton Fabric Roll' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'COT-001' })
  @IsString()
  sku!: string;

  @ApiProperty({ enum: InventoryCategory, example: 'RAW_MATERIAL' })
  @IsEnum(InventoryCategory)
  category!: InventoryCategory;

  @ApiProperty({ example: 'meters' })
  @IsString()
  unit!: string;

  @ApiProperty({ example: 50 })
  @IsPositive()
  minThreshold!: number;

  @ApiPropertyOptional({ example: 'Acme Textiles' })
  @IsOptional()
  @IsString()
  supplier?: string;

  @ApiPropertyOptional({ example: 'Warehouse A' })
  @IsOptional()
  @IsString()
  location?: string;
}
