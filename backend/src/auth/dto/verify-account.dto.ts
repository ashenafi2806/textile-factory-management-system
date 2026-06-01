import { ApiProperty } from '@nestjs/swagger';

export class VerifyAccountDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  email!: string;

  @ApiProperty({ example: 'ABC123XYZ', description: 'Verification token sent via email' })
  token!: string;
}

export class ResendVerificationDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  email!: string;
}
