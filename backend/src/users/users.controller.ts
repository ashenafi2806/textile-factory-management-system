import {
  Body,
  BadRequestException,
  Controller,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles('ADMIN', 'HR_ADMIN')
  findAll(): Promise<
    Array<{
      id: string;
      username: string;
      email: string;
      roles: { name: string }[];
      isVerified: boolean;
      mustChangePassword: boolean;
      createdAt: Date;
      updatedAt: Date;
    }>
  > {
    return this.usersService.findAll();
  }

  @Post()
  @Roles('ADMIN', 'HR_ADMIN')
  create(@Body() createUserDto: CreateUserDto): Promise<any> {
    return this.usersService.createUser(createUserDto);
  }

  @Patch('password')
  changePassword(
    @CurrentUser() user: { sub?: string; id?: string },
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const userId = user.sub ?? user.id;
    if (!userId) {
      throw new BadRequestException('Invalid authenticated user');
    }
    return this.usersService.changePassword(userId, changePasswordDto);
  }
}
