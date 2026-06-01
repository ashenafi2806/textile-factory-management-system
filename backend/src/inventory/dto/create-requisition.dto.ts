import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRequisitionDto {
  @ApiProperty()
  itemId!: string;

  @ApiProperty({ example: 50 })
  quantityRequested!: number;

  @ApiProperty({ example: 'Production order PO-001 requires cotton' })
  purpose!: string;

  @ApiPropertyOptional()
  referenceId?: string;
}
