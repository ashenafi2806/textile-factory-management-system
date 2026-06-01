import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MaintenancePriority, MaintenanceType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ enum: MaintenanceType, example: 'CORRECTIVE' })
  @IsEnum(MaintenanceType)
  type!: MaintenanceType;

  @ApiPropertyOptional({ enum: MaintenancePriority, example: 'MEDIUM' })
  @IsOptional()
  @IsEnum(MaintenancePriority)
  priority?: MaintenancePriority;

  @ApiProperty({ example: 'Cutting Machine #3' })
  @IsString()
  equipmentName!: string;

  @ApiProperty({ example: 'Belt slipping, needs adjustment' })
  @IsString()
  description!: string;

  @ApiPropertyOptional({ example: '2026-06-15' })
  @IsOptional()
  @IsString()
  scheduledDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedToId?: string;
}
