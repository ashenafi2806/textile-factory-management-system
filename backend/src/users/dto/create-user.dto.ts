import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleType } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'worker5', description: 'Unique username' })
  username!: string;

  @ApiProperty({ example: 'worker5@tfms.com', description: 'Unique email' })
  email!: string;

  @ApiProperty({ example: 'worker123', description: 'Initial password' })
  password!: string;

  @ApiProperty({
    type: [String],
    enum: [
      'ADMIN',
      'HR_ADMIN',
      'MANAGER',
      'SUPERVISOR',
      'WORKER',
      'STOREKEEPER',
      'PRODUCTION_MANAGER',
      'PRODUCTION_SUPERVISOR',
      'MAINTENANCE_MANAGER',
      'MAINTENANCE_TECHNICIAN',
      'QA_MANAGER',
      'QA_STAFF',
    ],
    example: ['WORKER'],
    description: 'Role names to assign',
  })
  roles!: RoleType[];

  @ApiPropertyOptional({ example: false })
  isVerified?: boolean;

  @ApiPropertyOptional({ example: true })
  mustChangePassword?: boolean;
}
