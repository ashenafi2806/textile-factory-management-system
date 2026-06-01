import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateIncidentDto {
  @ApiProperty({ example: 'Equipment malfunction' })
  title!: string;

  @ApiProperty({ example: 'The cutting machine stopped working at 10am' })
  description!: string;

  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH'], example: 'MEDIUM' })
  severity!: 'LOW' | 'MEDIUM' | 'HIGH';

  @ApiPropertyOptional({ example: '171e8e33-3a68-47dd-9e9b-61a6f8fb70cf' })
  workerId?: string;

  @ApiPropertyOptional()
  department?: string;
}
