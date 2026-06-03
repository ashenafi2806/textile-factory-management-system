import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Production' })
  name!: string;

  @ApiPropertyOptional({ example: 'Cutting, sewing, and finishing lines' })
  description?: string;
}
