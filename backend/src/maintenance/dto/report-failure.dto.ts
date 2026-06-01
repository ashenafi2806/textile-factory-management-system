import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MaintenancePriority } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ReportFailureDto {
  @ApiProperty({ example: 'Sewing Machine #5' })
  @IsString()
  equipmentName!: string;

  @ApiProperty({ example: 'Needle broke during operation' })
  @IsString()
  description!: string;

  @ApiPropertyOptional({ enum: MaintenancePriority, example: 'HIGH' })
  @IsOptional()
  @IsEnum(MaintenancePriority)
  priority?: MaintenancePriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productionOrderId?: string;
}
