export class CreateUserDto {
  username!: string;
  email!: string;
  password!: string;
  roles!: Array<import('@prisma/client').RoleType>;
  isVerified?: boolean;
  mustChangePassword?: boolean;
}
