import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async createDepartment(data: { name: string; description?: string }) {
    return this.prisma.department.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });
  }

  async findAll() {
    return this.prisma.department.findMany({
      include: {
        teams: {
          include: {
            workers: {
              include: {
                user: { select: { username: true, email: true } },
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        teams: {
          include: {
            workers: {
              include: {
                user: { select: { username: true, email: true } },
              },
            },
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return department;
  }

  async findDepartmentsForManager(managerId: string) {
    // Get manager's department from their worker profile
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      include: { workerProfile: true },
    });

    if (
      !manager ||
      !manager.workerProfile ||
      !manager.workerProfile.departmentId
    ) {
      return [];
    }

    return this.prisma.department.findMany({
      where: { id: manager.workerProfile.departmentId },
      include: {
        teams: {
          include: {
            workers: {
              include: {
                user: { select: { username: true, email: true } },
              },
            },
          },
        },
      },
    });
  }

  async createTeam(departmentId: string, data: { name: string }) {
    return this.prisma.team.create({
      data: {
        name: data.name,
        departmentId,
      },
    });
  }

  async updateDepartment(
    id: string,
    data: { name?: string; description?: string },
  ) {
    return this.prisma.department.update({
      where: { id },
      data,
    });
  }

  async deleteDepartment(id: string) {
    return this.prisma.department.delete({
      where: { id },
    });
  }

  async getDepartmentAnalytics(departmentId: string) {
    const workers = await this.prisma.workerProfile.count({
      where: { departmentId },
    });

    const teams = await this.prisma.team.count({
      where: { departmentId },
    });

    const attendanceToday = await this.prisma.attendance.count({
      where: {
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
        worker: { departmentId },
      },
    });

    return {
      departmentId,
      totalWorkers: workers,
      totalTeams: teams,
      attendanceToday,
      attendanceRate: workers > 0 ? (attendanceToday / workers) * 100 : 0,
    };
  }
}
