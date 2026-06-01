import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOvertimeDto {
  @ApiProperty({ example: '171e8e33-3a68-47dd-9e9b-61a6f8fb70cf' })
  workerId!: string;

  @ApiProperty({ example: '2026-06-01' })
  date!: string;

  @ApiProperty({ example: 2, description: 'Overtime hours' })
  hours!: number;

  @ApiPropertyOptional({ example: 'Production deadline' })
  reason?: string;
}
