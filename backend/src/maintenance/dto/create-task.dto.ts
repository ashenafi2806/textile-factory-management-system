import { MaintenancePriority, MaintenanceType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateTaskDto {
  @IsEnum(MaintenanceType)
  type!: MaintenanceType;

  @IsOptional()
  @IsEnum(MaintenancePriority)
  priority?: MaintenancePriority;

  @IsString()
  equipmentName!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  scheduledDate?: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;
}