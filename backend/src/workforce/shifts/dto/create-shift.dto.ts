import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsISO8601 } from 'class-validator';

export class CreateShiftDto {
  @ApiProperty({ example: 'Morning' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '08:00' })
  @IsString()
  @IsNotEmpty()
  startTime!: string;

  @ApiProperty({ example: '17:00' })
  @IsString()
  @IsNotEmpty()
  endTime!: string;

  @ApiProperty({ example: '2026-06-01' })
  @IsISO8601()
  @IsNotEmpty()
  startDate!: string;

  @ApiProperty({ example: '2026-06-30' })
  @IsISO8601()
  @IsNotEmpty()
  endDate!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateShiftDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional()
  @IsISO8601()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsISO8601()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}
