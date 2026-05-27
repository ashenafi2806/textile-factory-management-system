import { IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';

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
}
