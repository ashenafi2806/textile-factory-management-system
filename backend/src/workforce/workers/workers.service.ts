/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class WorkersService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  private async generateEmployeeId(): Promise<string> {
    const lastWorker = await this.prisma.workerProfile.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { employeeId: true },
    });
    const lastNum = lastWorker
      ? parseInt(lastWorker.employeeId.replace('EMP-', ''), 10)
      : 0;
    return `EMP-${String(lastNum + 1).padStart(4, '0')}`;
  }

  async createWorker(data: {
    username: string;
    email: string;
    password?: string;
    employeeId?: string;
    position: string;
    salary?: number;
    phoneNumber?: string;
    skillLevel?: string;
    emergencyContact?: string;
    departmentId?: string;
    teamId?: string;
    roles?: string[];
  }) {
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { username: data.username }] },
    });
    if (existingUser) throw new ConflictException('User already exists');

    const hashedPassword = await bcrypt.hash(data.password || 'worker123', 10);
    const assignedRoles = data.roles || ['WORKER'];
    const verificationToken = Math.random()
      .toString(36)
      .substring(2, 12)
      .toUpperCase();

    const employeeId = data.employeeId || (await this.generateEmployeeId());

    return this.prisma.$transaction(async (tx) => {
      // Create User
      const user = await tx.user.create({
        data: {
          username: data.username,
          email: data.email,
          password: hashedPassword,
          verificationToken,
          roles: {
            connect: assignedRoles.map((name) => ({ name: name as any })),
          },
        },
      });

      await this.mailService.sendWelcomeEmail(
        data.email,
        data.username,
        verificationToken,
      );

      // Create WorkerProfile
      return tx.workerProfile.create({
        data: {
          employeeId,
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
            id: true,
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

  async findByManagerTeam(managerId: string) {
    // First find the manager's department
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      include: {
        workerProfile: true,
      },
    });

    if (!manager || !manager.workerProfile) {
      return [];
    }

    // Get the department of the manager's worker profile
    const managerProfile = manager.workerProfile;

    // Find all workers in the same department (for department managers)
    // Or if manager has a specific team, filter by team
    const workers = await this.prisma.workerProfile.findMany({
      where: {
        departmentId: managerProfile.departmentId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            roles: true,
          },
        },
        department: true,
        team: true,
      },
    });

    return workers;
  }

  async findOneInTeam(workerId: string, managerId: string) {
    // Get manager's department
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      include: { workerProfile: true },
    });

    if (!manager || !manager.workerProfile) {
      throw new NotFoundException('Manager profile not found');
    }

    const worker = await this.prisma.workerProfile.findFirst({
      where: {
        id: workerId,
        departmentId: manager.workerProfile.departmentId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            roles: true,
          },
        },
        department: true,
        team: true,
      },
    });

    if (!worker) {
      throw new NotFoundException('Worker not found in your team');
    }

    return worker;
  }

  async findOne(id: string) {
    const worker = await this.prisma.workerProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            roles: true,
          },
        },
        department: true,
        team: true,
        attendances: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        leaveRequests: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!worker) {
      throw new NotFoundException('Worker not found');
    }

    return worker;
  }

  async updateWorker(id: string, data: any) {
    return this.prisma.workerProfile.update({
      where: { id },
      data,
    });
  }

  async deleteWorker(id: string) {
    // First find the associated user
    const worker = await this.prisma.workerProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!worker) {
      throw new NotFoundException('Worker not found');
    }

    // Delete worker profile and user in transaction
    return this.prisma.$transaction(async (tx) => {
      await tx.workerProfile.delete({
        where: { id },
      });

      await tx.user.delete({
        where: { id: worker.userId },
      });
    });
  }

  async getWorkforceAnalytics(managerId?: string) {
    let departmentId: string | undefined;

    if (managerId) {
      const manager = await this.prisma.user.findUnique({
        where: { id: managerId },
        include: { workerProfile: true },
      });
      departmentId = manager?.workerProfile?.departmentId || undefined;
    }

    const whereCondition = departmentId ? { departmentId } : {};

    const totalWorkers = await this.prisma.workerProfile.count({
      where: whereCondition,
    });

    const workersByPosition = await this.prisma.workerProfile.groupBy({
      by: ['position'],
      where: whereCondition,
      _count: true,
    });

    const workersBySkillLevel = await this.prisma.workerProfile.groupBy({
      by: ['skillLevel'],
      where: whereCondition,
      _count: true,
    });

    const activeLeaves = await this.prisma.leaveRequest.count({
      where: {
        status: 'APPROVED',
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
        worker: departmentId ? { departmentId } : undefined,
      },
    });

    const pendingLeaves = await this.prisma.leaveRequest.count({
      where: {
        status: 'PENDING',
        worker: departmentId ? { departmentId } : undefined,
      },
    });

    // Today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await this.prisma.attendance.count({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
        worker: departmentId ? { departmentId } : undefined,
      },
    });

    return {
      totalWorkers,
      activeLeaves,
      pendingLeaves,
      availableWorkers: totalWorkers - activeLeaves,
      todayAttendance,
      workersByPosition: workersByPosition.filter((w) => w._count > 0),
      workersBySkillLevel: workersBySkillLevel.filter(
        (w) => w.skillLevel && w._count > 0,
      ),
    };
  }
}
