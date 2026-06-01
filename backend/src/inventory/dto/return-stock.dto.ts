import { IsUUID, IsPositive, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReturnStockDto {
  @ApiProperty()
  @IsUUID()
  itemId!: string;

  @ApiProperty({ example: 5 })
  @IsPositive()
  quantity!: number;

  @ApiProperty({ description: 'Original ISSUE transaction being returned' })
  @IsUUID()
  referenceTransactionId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
