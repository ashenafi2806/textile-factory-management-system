import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMeDto {
  @ApiPropertyOptional({ example: 'worker5' })
  username?: string;

  @ApiPropertyOptional({ example: 'worker5@tfms.com' })
  email?: string;

  @ApiPropertyOptional({ example: '+251911223344' })
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'Jane Doe (+251922334455)' })
  emergencyContact?: string;

  @ApiPropertyOptional({ example: 'Cutting Operator' })
  position?: string;

  @ApiPropertyOptional({ example: 'Intermediate' })
  skillLevel?: string;
}
