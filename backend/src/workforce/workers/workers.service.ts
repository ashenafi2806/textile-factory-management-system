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
    salary?: number;
    phoneNumber?: string;
    skillLevel?: string;
    emergencyContact?: string;
    departmentId?: string;
    teamId?: string;
    roles?: string[]; // e.g. ["WORKER", "SUPERVISOR"]
  }) {
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { username: data.username }] },
    });
    if (existingUser) throw new ConflictException('User already exists');

    const hashedPassword = await bcrypt.hash(data.password || 'worker123', 10);
    const assignedRoles = data.roles || ['WORKER'];
    const verificationToken = Math.random().toString(36).substring(2, 12).toUpperCase();

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: data.username,
          email: data.email,
          password: hashedPassword,
          verificationToken,
          roles: {
            connect: assignedRoles.map(name => ({ name: name as any })),
          },
        },
      });

      console.log(`[EMAIL SIMULATION] To: ${data.email} | Welcome to TFMS! Your verification token is: ${verificationToken}. Default Password: ${data.password || 'worker123'}`);

      return (tx as any).workerProfile.create({
        data: {
          employeeId: data.employeeId,
          userId: user.id,
          position: data.position,
          salary: data.salary,
          phoneNumber: data.phoneNumber,
          skillLevel: data.skillLevel,
          emergencyContact: data.emergencyContact,
          departmentId: data.departmentId,
          teamId: data.teamId,
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
