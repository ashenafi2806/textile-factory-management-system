import { IsArray, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteTaskSparePartDto {
  @ApiProperty()
  @IsString()
  itemId!: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  quantityUsed!: number;
}

export class CompleteTaskDto {
  @ApiPropertyOptional({ type: [CompleteTaskSparePartDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompleteTaskSparePartDto)
  spareParts?: CompleteTaskSparePartDto[];

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsInt()
  timeSpentMins?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
