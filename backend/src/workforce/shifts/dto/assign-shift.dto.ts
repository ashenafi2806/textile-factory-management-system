import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsISO8601,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignShiftDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workerId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  shiftId!: string;

  @ApiPropertyOptional({
    example: '2026-06-01',
    description: 'Optional override; defaults to shift start/end dates',
  })
  @IsISO8601()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsISO8601()
  @IsOptional()
  endDate?: string;
}

export class BulkAssignShiftDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  workerIds!: string[];
}

export class UpdateWorkerShiftDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  shiftId!: string;
}

export class UpdateRotationPatternDto {
  @ApiProperty({
    type: [String],
    example: ['Morning', 'Evening', 'Off'],
    description: 'Rotation of shift names',
  })
  pattern!: string[];
}
