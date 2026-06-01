import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@tfms.com', description: 'User email' })
  email!: string;

  @ApiProperty({ example: 'admin123', description: 'User password' })
  password!: string;
}
