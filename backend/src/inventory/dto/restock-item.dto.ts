import { IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';

export class RestockItemDto {
  @IsUUID()
  itemId!: string;

  @IsPositive()
  quantity!: number;

  @IsOptional()
  @IsString()
  note?: string;
}
