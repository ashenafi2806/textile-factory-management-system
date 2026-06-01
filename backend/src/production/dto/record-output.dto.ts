import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordOutputDto {
  @ApiProperty()
  stageId!: string;

  @ApiProperty({ example: '2026-06-01' })
  shiftDate!: string;

  @ApiProperty({ example: 100 })
  goodQuantity!: number;

  @ApiPropertyOptional({ example: 5 })
  defectiveQuantity?: number;

  @ApiPropertyOptional()
  notes?: string;
}
