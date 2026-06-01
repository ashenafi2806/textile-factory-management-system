import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BomItemDto {
  @ApiProperty()
  materialId!: string;

  @ApiProperty({ example: 100 })
  requiredQuantity!: number;

  @ApiProperty({ example: 'kg' })
  unit!: string;
}

export class CreateProductionOrderDto {
  @ApiProperty({ example: 'Cotton T-Shirt' })
  productName!: string;

  @ApiProperty({ example: 'TSHIRT-COT-001' })
  productCode!: string;

  @ApiProperty({ example: 500 })
  targetQuantity!: number;

  @ApiProperty({ example: '2026-07-15' })
  deadline!: string;

  @ApiPropertyOptional()
  assignedSupervisorId?: string;

  @ApiPropertyOptional({ type: [BomItemDto] })
  bomItems?: BomItemDto[];
}
