import {
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  IsIn,
} from 'class-validator';

export class IssueStockDto {
  @IsUUID()
  itemId!: string;

  @IsPositive()
  quantity!: number;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsString()
  note?: string;

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
