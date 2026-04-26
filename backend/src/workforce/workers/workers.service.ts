import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class WorkersService {
  constructor(private prisma: PrismaService) {}

  async createWorker(data: {
    username: string;
    email: string;
    password?: string;
    employeeId: string;
    position: string;
    departmentId?: string;
    teamId?: string;
    rotationPattern?: string;
  }) {
    // Check if user exists
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { username: data.username }] },
    });
    if (existingUser) throw new ConflictException('User already exists');

    const hashedPassword = await bcrypt.hash(data.password || 'worker123', 10);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: data.username,
          email: data.email,
          password: hashedPassword,
          roles: {
            connect: [{ name: 'WORKER' }],
          },
        },
      });

      return tx.workerProfile.create({
        data: {
          employeeId: data.employeeId,
          userId: user.id,
          position: data.position,
          departmentId: data.departmentId,
          teamId: data.teamId,
          rotationPattern: data.rotationPattern,
        },
      });
    });
  }

  async findAll() {
    return this.prisma.workerProfile.findMany({
      include: {
        user: {
          select: {
            username: true,
            email: true,
            roles: true,
          },
        },
        department: true,
        team: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.workerProfile.findUnique({
      where: { id },
      include: {
        user: true,
        department: true,
        team: true,
      },
    });
  }

  async updateWorker(id: string, data: any) {
    return this.prisma.workerProfile.update({
      where: { id },
      data,
    });
  }

  async deleteWorker(id: string) {
    return this.prisma.workerProfile.delete({
      where: { id },
    });
  }
}
