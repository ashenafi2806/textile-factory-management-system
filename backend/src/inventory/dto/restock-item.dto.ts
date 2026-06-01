import { IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RestockItemDto {
  @ApiProperty()
  @IsUUID()
  itemId!: string;

  @ApiProperty({ example: 100 })
  @IsPositive()
  quantity!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
