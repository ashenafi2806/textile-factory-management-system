import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, RoleType, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';

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

  async findOneByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      include: { roles: true },
    });
  }
}
