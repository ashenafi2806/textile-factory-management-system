import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkerDto {
  @ApiProperty({ example: 'worker5' })
  username!: string;

  @ApiProperty({ example: 'worker5@tfms.com' })
  email!: string;

  @ApiPropertyOptional({ example: 'worker123' })
  password?: string;

  @ApiPropertyOptional({ example: 'EMP005' })
  employeeId?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  fullName?: string;

  @ApiProperty({ example: 'Cutting Operator' })
  position!: string;

  @ApiPropertyOptional({ example: 15000 })
  salary?: number;

  @ApiPropertyOptional({ example: '+251911223344' })
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'Intermediate' })
  skillLevel?: string;

  @ApiPropertyOptional({ example: 'Jane Doe (+251922334455)' })
  emergencyContact?: string;

  @ApiPropertyOptional({ example: 'Production' })
  department?: string;

  @ApiPropertyOptional({ type: [String], example: ['WORKER'] })
  roles?: string[];
}

export class UpdateWorkerDto {
  @ApiPropertyOptional()
  fullName?: string;

  @ApiPropertyOptional()
  position?: string;

  @ApiPropertyOptional()
  salary?: number;

  @ApiPropertyOptional()
  phoneNumber?: string;

  @ApiPropertyOptional()
  skillLevel?: string;

  @ApiPropertyOptional()
  emergencyContact?: string;

  @ApiPropertyOptional()
  department?: string;
}
