import { InventoryCategory } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateInventoryItemDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsString()
  sku!: string;

  @IsEnum(InventoryCategory)
  category!: InventoryCategory;

  @IsString()
  unit!: string;

  @IsPositive()
  minThreshold!: number;

  @IsOptional()
  @IsString()
  supplier?: string;

  @IsOptional()
  @IsString()
  location?: string;
}
