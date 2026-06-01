import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordAttendanceDto {
  @ApiProperty({ example: '171e8e33-3a68-47dd-9e9b-61a6f8fb70cf' })
  workerId!: string;

  @ApiProperty({ example: '2026-06-01', description: 'YYYY-MM-DD' })
  date!: string;

  @ApiProperty({ example: '2026-06-01T08:00:00.000Z' })
  checkIn!: string;

  @ApiPropertyOptional({ example: '2026-06-01T17:00:00.000Z' })
  checkOut?: string;
}

export class UpdateAttendanceDto {
  @ApiPropertyOptional({ example: '2026-06-01T08:00:00.000Z' })
  checkIn?: string;

  @ApiPropertyOptional({ example: '2026-06-01T17:00:00.000Z' })
  checkOut?: string;
}
