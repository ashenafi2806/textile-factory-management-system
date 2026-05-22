import { MaintenancePriority } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ReportFailureDto {
  @IsString()
  equipmentName!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsEnum(MaintenancePriority)
  priority?: MaintenancePriority;

  @IsOptional()
  @IsString()
  productionOrderId?: string;
}