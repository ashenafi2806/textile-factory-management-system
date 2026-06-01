import {
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class IssueStockDto {
  @ApiProperty()
  @IsUUID()
  itemId!: string;

  @ApiProperty({ example: 20 })
  @IsPositive()
  quantity!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    enum: ['REQUISITION', 'PRODUCTION_ORDER', 'MAINTENANCE_TASK', 'RECEIPT', 'OTHER'],
  })
  @IsOptional()
  @IsIn([
    'REQUISITION',
    'PRODUCTION_ORDER',
    'MAINTENANCE_TASK',
    'RECEIPT',
    'OTHER',
  ])
  referenceType?: string;
}
