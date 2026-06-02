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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { saveProfilePicture } from '../common/profile-picture.storage';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';

@ApiTags('users')
@ApiBearerAuth('jwt')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiOperation({ summary: 'List all users (Admin/HR)' })
  @ApiResponse({ status: 200, description: 'List of users' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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

  @ApiOperation({ summary: 'Create a new user (Admin/HR)' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created' })
  @ApiResponse({ status: 409, description: 'Email or username already exists' })
  @Post()
  @Roles('ADMIN', 'HR_ADMIN')
  create(@Body() createUserDto: CreateUserDto): Promise<any> {
    return this.usersService.createUser(createUserDto);
  }

  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Profile returned' })
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

  @ApiOperation({ summary: 'Update the authenticated user profile' })
  @ApiBody({ type: UpdateMeDto })
  @ApiResponse({ status: 200, description: 'Profile updated' })
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
    @Body() data: UpdateMeDto,
  ) {
    const userId = user.id ?? user.sub;
    if (!userId) {
      throw new BadRequestException('Invalid authenticated user');
    }
    return this.usersService.updateMe(userId, data);
  }

  @ApiOperation({ summary: 'Change the authenticated user password' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: 'Password changed' })
  @ApiResponse({ status: 400, description: 'Current password is incorrect' })
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

  @ApiOperation({ summary: 'Upload a profile picture for the authenticated user' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        photo: {
          type: 'string',
          format: 'binary',
          description: 'Image file (jpg/png)',
        },
      },
      required: ['photo'],
    },
  })
  @ApiResponse({ status: 201, description: 'Picture saved, returns URL' })
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

    try {
      const url = saveProfilePicture(userId, file.buffer, file.originalname);
      return { url };
    } catch {
      throw new BadRequestException('Failed to save file');
    }
  }
}
