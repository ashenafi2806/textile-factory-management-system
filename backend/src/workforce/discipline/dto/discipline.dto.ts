import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DisciplinaryCategory, DisciplinaryStatus, IncidentSeverity } from '@prisma/client';

export class CreateDisciplinaryActionDto {
  @ApiProperty()
  @IsString()
  workerId!: string;

  @ApiProperty({ enum: DisciplinaryCategory, example: 'WRITTEN_WARNING' })
  @IsEnum(DisciplinaryCategory)
  category!: DisciplinaryCategory;

  @ApiPropertyOptional({ enum: IncidentSeverity, example: 'MEDIUM' })
  @IsOptional()
  @IsEnum(IncidentSeverity)
  severity?: IncidentSeverity;

  @ApiProperty({ example: 'Repeated tardiness in May' })
  @IsString()
  subject!: string;

  @ApiPropertyOptional({ example: 'Arrived late 5 times in May' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateDisciplinaryActionDto {
  @ApiPropertyOptional({ enum: DisciplinaryStatus })
  @IsOptional()
  @IsEnum(DisciplinaryStatus)
  status?: DisciplinaryStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
