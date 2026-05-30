import { IsUUID, IsPositive, IsOptional, IsString } from 'class-validator';

export class ReturnStockDto {
  @IsUUID()
  itemId!: string;

  @IsPositive()
  quantity!: number;

  @IsUUID()
  referenceTransactionId!: string; // the original ISSUE transaction being returned against

  @IsOptional()
  @IsString()
  note?: string;
}
