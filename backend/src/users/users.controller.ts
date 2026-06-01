import {
  Body,
  BadRequestException,
  Controller,
  Get,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';

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

  @Get('me')
  @Roles(
    'WORKER',
    'SUPERVISOR',
    'MANAGER',
    'HR_ADMIN',
    'STOREKEEPER',
    'PRODUCTION_MANAGER',
    'PRODUCTION_SUPERVISOR',
    'MAINTENANCE_MANAGER',
    'MAINTENANCE_TECHNICIAN',
    'QA_MANAGER',
    'QA_STAFF',
    'ADMIN',
  )
  getMe(@CurrentUser() user: { id?: string; sub?: string }) {
    const userId = user.id ?? user.sub;
    if (!userId) {
      throw new BadRequestException('Invalid authenticated user');
    }
    return this.usersService.getMe(userId);
  }

  @Patch('me')
  @Roles(
    'WORKER',
    'SUPERVISOR',
    'MANAGER',
    'HR_ADMIN',
    'STOREKEEPER',
    'PRODUCTION_MANAGER',
    'PRODUCTION_SUPERVISOR',
    'MAINTENANCE_MANAGER',
    'MAINTENANCE_TECHNICIAN',
    'QA_MANAGER',
    'QA_STAFF',
    'ADMIN',
  )
  updateMe(
    @CurrentUser() user: { id?: string; sub?: string },
    @Body()
    data: {
      username?: string;
      email?: string;
      phoneNumber?: string;
      emergencyContact?: string;
      position?: string;
      skillLevel?: string;
    },
  ) {
    const userId = user.id ?? user.sub;
    if (!userId) {
      throw new BadRequestException('Invalid authenticated user');
    }
    return this.usersService.updateMe(userId, data);
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

  @Post('me/photo')
  @UseInterceptors(
    FileInterceptor('photo', { storage: multer.memoryStorage() }),
  )
  @Roles(
    'WORKER',
    'SUPERVISOR',
    'MANAGER',
    'HR_ADMIN',
    'STOREKEEPER',
    'PRODUCTION_MANAGER',
    'PRODUCTION_SUPERVISOR',
    'MAINTENANCE_MANAGER',
    'MAINTENANCE_TECHNICIAN',
    'QA_MANAGER',
    'QA_STAFF',
    'ADMIN',
  )
  async uploadPhoto(
    @CurrentUser() user: { id?: string; sub?: string },
    @UploadedFile() file: any,
  ) {
    const userId = user.id ?? user.sub;
    if (!userId) {
      throw new BadRequestException('Invalid authenticated user');
    }

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const repoRoot = path.resolve(__dirname, '..', '..', '..');
    const uploadDir = path.join(repoRoot, 'frontend', 'public', 'profile-pics');
    try {
      fs.mkdirSync(uploadDir, { recursive: true });
      const ext = path.extname(file.originalname) || '.jpg';
      const filename = `${userId}${ext}`;
      const dest = path.join(uploadDir, filename);
      fs.writeFileSync(dest, file.buffer);
      return { url: `/profile-pics/${filename}` };
    } catch (e) {
      throw new BadRequestException('Failed to save file');
    }
  }
}
