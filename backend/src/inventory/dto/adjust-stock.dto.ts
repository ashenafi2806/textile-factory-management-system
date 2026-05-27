import { IsNumber, IsString, IsUUID } from 'class-validator';

export class AdjustStockDto {
  @IsUUID()
  itemId!: string;

  @IsNumber()
  quantity!: number;

  @IsString()
  note!: string;
}
