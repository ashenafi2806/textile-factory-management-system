import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async createDepartment(data: { name: string; description?: string }) {
    return this.prisma.department.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.department.findMany({
      include: { teams: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.department.findUnique({
      where: { id },
      include: { teams: true },
    });
  }

  async createTeam(departmentId: string, data: { name: string }) {
    return this.prisma.team.create({
      data: {
        ...data,
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
}
