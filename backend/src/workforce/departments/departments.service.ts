import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const [departments, workerCounts] = await Promise.all([
      this.prisma.department.findMany({ orderBy: { name: 'asc' } }),
      this.prisma.workerProfile.groupBy({
        by: ['department'],
        where: { NOT: { department: null } },
        _count: { id: true },
      }),
    ]);

    const countMap = new Map(
      workerCounts
        .filter((row) => row.department)
        .map((row) => [row.department as string, row._count.id]),
    );

    return departments.map((dept) => ({
      ...dept,
      workerCount: countMap.get(dept.name) ?? 0,
    }));
  }

  async create(dto: CreateDepartmentDto) {
    const name = dto.name.trim();
    if (!name) {
      throw new ConflictException('Department name is required');
    }

    const existing = await this.prisma.department.findFirst({
      where: { name: { equals: name } },
    });
    if (existing) {
      throw new ConflictException('Department already exists');
    }

    return this.prisma.department.create({
      data: {
        name,
        description: dto.description?.trim() || null,
      },
    });
  }

  async remove(id: string) {
    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept) {
      throw new NotFoundException('Department not found');
    }

    const assigned = await this.prisma.workerProfile.count({
      where: { department: dept.name },
    });
    if (assigned > 0) {
      throw new ConflictException(
        `Cannot delete department with ${assigned} assigned worker(s)`,
      );
    }

    return this.prisma.department.delete({ where: { id } });
  }
}
