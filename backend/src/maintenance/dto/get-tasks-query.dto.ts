import { MaintenancePriority, MaintenanceStatus, MaintenanceType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsInt } from 'class-validator';

export class GetTasksQueryDto {
  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @IsOptional()
  @IsEnum(MaintenanceType)
  type?: MaintenanceType;

  @IsOptional()
  @IsEnum(MaintenancePriority)
  priority?: MaintenancePriority;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsInt()
  page?: number;

  @IsOptional()
  @IsInt()
  limit?: number;
}