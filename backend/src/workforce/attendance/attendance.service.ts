import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async recordAttendance(data: {
    workerId: string;
    date: Date;
    checkIn: Date;
    checkOut?: Date;
    recordedById: string;
  }) {
    // Check if attendance already exists for this worker and date
    const existing = await this.prisma.attendance.findFirst({
      where: {
        workerId: data.workerId,
        date: {
          gte: new Date(new Date(data.date).setHours(0, 0, 0, 0)),
          lt: new Date(new Date(data.date).setHours(23, 59, 59, 999)),
        },
      },
    });

    if (existing) {
      return this.prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkOut: data.checkOut || existing.checkOut,
          recordedById: data.recordedById,
        },
      });
    }

    return this.prisma.attendance.create({
      data: {
        workerId: data.workerId,
        date: data.date,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        recordedById: data.recordedById,
      },
    });
  }

  async getAttendanceByWorker(workerId: string) {
    return this.prisma.attendance.findMany({
      where: { workerId },
      include: { recordedBy: { select: { username: true } } },
      orderBy: { date: 'desc' },
    });
  }

  async getAttendanceForTeam(teamId: string, date: Date) {
    return this.prisma.attendance.findMany({
      where: {
        worker: { teamId },
        date: {
          gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
          lt: new Date(new Date(date).setHours(23, 59, 59, 999)),
        },
      },
      include: {
        worker: { include: { user: { select: { username: true } } } },
      },
    });
  }
}
