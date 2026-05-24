/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
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
    const startOfDay = new Date(data.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(data.date);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await this.prisma.attendance.findFirst({
      where: {
        workerId: data.workerId,
        date: {
          gte: startOfDay,
          lt: endOfDay,
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

  async getAttendanceByWorker(
    workerId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const whereCondition: any = { workerId };

    if (startDate && endDate) {
      whereCondition.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    return this.prisma.attendance.findMany({
      where: whereCondition,
      include: {
        recordedBy: { select: { username: true, email: true } },
        worker: {
          include: {
            user: { select: { username: true, email: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async getAttendanceForTeam(teamId: string, date: Date, managerId?: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const whereCondition: any = {
      worker: { teamId },
      date: {
        gte: startOfDay,
        lt: endOfDay,
      },
    };

    if (managerId) {
      const manager = await this.prisma.user.findUnique({
        where: { id: managerId },
        include: { workerProfile: true },
      });

      if (manager?.workerProfile?.departmentId) {
        whereCondition.worker.departmentId = manager.workerProfile.departmentId;
      }
    }

    return this.prisma.attendance.findMany({
      where: whereCondition,
      include: {
        worker: {
          include: {
            user: { select: { username: true, email: true } },
            department: true,
            team: true,
          },
        },
        recordedBy: { select: { username: true } },
      },
    });
  }

  async getAttendanceAnalytics(
    managerId?: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    let departmentId: string | undefined;

    if (managerId) {
      const manager = await this.prisma.user.findUnique({
        where: { id: managerId },
        include: { workerProfile: true },
      });
      departmentId = manager?.workerProfile?.departmentId || undefined;
    }

    const whereCondition: any = {};

    if (departmentId) {
      whereCondition.worker = { departmentId };
    }

    if (startDate && endDate) {
      whereCondition.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const totalAttendance = await this.prisma.attendance.count({
      where: whereCondition,
    });

    const totalWorkers = await this.prisma.workerProfile.count({
      where: departmentId ? { departmentId } : {},
    });

    const averageAttendancePerWorker =
      totalWorkers > 0 ? totalAttendance / totalWorkers : 0;

    // Get unique workers who have attendance
    const uniqueWorkers = await this.prisma.attendance.groupBy({
      by: ['workerId'],
      where: whereCondition,
      _count: true,
    });

    // Get attendance by day of week
    const attendances = await this.prisma.attendance.findMany({
      where: whereCondition,
      select: { date: true, checkIn: true },
    });

    const attendanceByDay = this.groupAttendanceByDay(attendances);

    return {
      totalAttendanceRecords: totalAttendance,
      totalWorkers,
      activeWorkers: uniqueWorkers.length,
      averageAttendancePerWorker:
        Math.round(averageAttendancePerWorker * 100) / 100,
      attendanceByDay,
    };
  }

  private groupAttendanceByDay(attendances: any[]) {
    const dayCount: { [key: string]: number } = {
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
      Sunday: 0,
    };

    attendances.forEach((att) => {
      const dayName = att.date.toLocaleString('en-US', { weekday: 'long' });
      if (dayCount[dayName] !== undefined) {
        dayCount[dayName]++;
      }
    });

    return Object.entries(dayCount).map(([day, count]) => ({ day, count }));
  }
}
