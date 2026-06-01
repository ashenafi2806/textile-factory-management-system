import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  access_token!: string;

  @ApiProperty({
    description: 'Authenticated user record',
    example: {
      id: 'dc51deb6-971a-4cfe-9368-c312c6fff14a',
      username: 'admin',
      email: 'admin@tfms.com',
      roles: ['ADMIN'],
    },
  })
  user!: {
    id: string;
    username: string;
    email: string;
    roles: string[];
  };
}
