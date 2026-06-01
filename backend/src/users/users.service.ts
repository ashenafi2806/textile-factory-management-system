import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as path from 'path';
import * as fs from 'fs';
import { Prisma, RoleType, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });
  }

  async createUser(data: CreateUserDto): Promise<Omit<User, 'password'>> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        password: hashedPassword,
        isVerified: data.isVerified ?? false,
        mustChangePassword: data.mustChangePassword ?? true,
        roles: {
          connect: data.roles?.map((name) => ({ name: name as RoleType })),
        },
      },
      include: {
        roles: true,
      },
    });
    const { password, ...userSafe } = user;
    return userSafe;
  }

  async findAll(): Promise<
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
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        roles: true,
        isVerified: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOneByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { roles: true },
    });
  }

  async findOneById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { roles: true },
    });
  }

  async getMe(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: true,
        workerProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...safe } = user;
    // Attach profile picture URL if a file exists in frontend/public/profile-pics
    try {
      const repoRoot = path.resolve(__dirname, '..', '..');
      const picsDir = path.join(repoRoot, 'frontend', 'public', 'profile-pics');
      const exts = ['.png', '.jpg', '.jpeg', '.gif'];
      for (const ext of exts) {
        const fname = path.join(picsDir, `${id}${ext}`);
        if (fs.existsSync(fname)) {
          (safe as any).profilePictureUrl = `/profile-pics/${id}${ext}`;
          break;
        }
      }
    } catch (e) {
      // ignore
    }
    return safe;
  }

  async updateMe(
    id: string,
    data: {
      username?: string;
      email?: string;
      phoneNumber?: string;
      emergencyContact?: string;
      position?: string;
      skillLevel?: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { workerProfile: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id },
        data: {
          username: data.username,
          email: data.email,
        },
        include: { roles: true, workerProfile: true },
      });

      if (user.workerProfile) {
        await tx.workerProfile.update({
          where: { id: user.workerProfile.id },
          data: {
            phoneNumber: data.phoneNumber,
            emergencyContact: data.emergencyContact,
            position: data.position,
            skillLevel: data.skillLevel,
          },
        });
      }

      return tx.user.findUnique({
        where: { id },
        include: {
          roles: true,
          workerProfile: true,
        },
      });
    });
  }

  async findOneByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      include: { roles: true },
    });
  }

  async changePassword(userId: string, data: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const isMatch = await bcrypt.compare(data.currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect');
    }
    const hashedPassword = await bcrypt.hash(data.newPassword, 10);
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        isVerified: true,
        mustChangePassword: false,
      },
      select: {
        id: true,
        username: true,
        email: true,
        isVerified: true,
        mustChangePassword: true,
      },
    });
  }
}
