import { IsNumber, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdjustStockDto {
  @ApiProperty()
  @IsUUID()
  itemId!: string;

  @ApiProperty({ example: 5, description: 'Positive or negative adjustment' })
  @IsNumber()
  quantity!: number;

  @ApiProperty({ example: 'Inventory recount discrepancy' })
  @IsString()
  note!: string;
}
