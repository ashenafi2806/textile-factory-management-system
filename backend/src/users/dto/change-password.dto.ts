import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'oldPass123', description: 'Current password' })
  currentPassword!: string;

  @ApiProperty({ example: 'newPass456', description: 'New password (min 6 chars)' })
  newPassword!: string;
}
