import { IsString, IsNotEmpty, IsOptional, IsISO8601 } from 'class-validator';
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

  @ApiProperty({ example: '2026-06-01' })
  @IsISO8601()
  @IsNotEmpty()
  date!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  createdById?: string;
}

export class UpdateRotationPatternDto {
  @ApiProperty({
    type: [String],
    example: ['Morning', 'Evening', 'Off'],
    description: 'Rotation of shift names',
  })
  pattern!: string[];
}
