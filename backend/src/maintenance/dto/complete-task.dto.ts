import { IsArray, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CompleteTaskSparePartDto {
  @IsString()
  itemId!: string;

  @IsInt()
  quantityUsed!: number;
}

export class CompleteTaskDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompleteTaskSparePartDto)
  spareParts?: CompleteTaskSparePartDto[];

  @IsOptional()
  @IsInt()
  timeSpentMins?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}