import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum AttendanceStatusDto {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  ON_LEAVE = 'ON_LEAVE',
}

export class RecordAttendanceDto {
  @ApiProperty({ example: '171e8e33-3a68-47dd-9e9b-61a6f8fb70cf' })
  workerId!: string;

  @ApiProperty({ example: '2026-06-01', description: 'YYYY-MM-DD' })
  date!: string;

  @ApiPropertyOptional({ example: '2026-06-01T08:00:00.000Z' })
  checkIn?: string;

  @ApiPropertyOptional({ example: '2026-06-01T17:00:00.000Z' })
  checkOut?: string;

  @ApiPropertyOptional({ enum: AttendanceStatusDto })
  @IsOptional()
  @IsEnum(AttendanceStatusDto)
  status?: AttendanceStatusDto;
}

export class UpdateAttendanceDto {
  @ApiPropertyOptional({ example: '2026-06-01T08:00:00.000Z' })
  checkIn?: string;

  @ApiPropertyOptional({ example: '2026-06-01T17:00:00.000Z' })
  checkOut?: string;

  @ApiPropertyOptional({ enum: AttendanceStatusDto })
  @IsOptional()
  @IsEnum(AttendanceStatusDto)
  status?: AttendanceStatusDto;
}
