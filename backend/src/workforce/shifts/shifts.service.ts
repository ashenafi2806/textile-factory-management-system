/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Shift } from '@prisma/client';

// Export the interfaces so they can be used as return types
export interface ScheduleItem {
  date: Date;
  shift: {
    name?: string;
    startTime?: string;
    endTime?: string;
    isOffDay?: boolean;
  } | null;
}

export interface TeamScheduleItem {
  workerId: string;
  workerName: string;
  schedule: ScheduleItem[];
}

@Injectable()
export class ShiftsService {
  constructor(private prisma: PrismaService) {}

  async createShift(data: {
    name: string;
    startTime: string;
    endTime: string;
  }) {
    return this.prisma.shift.create({
      data,
    });
  }

  async findAll(): Promise<Shift[]> {
    return this.prisma.shift.findMany();
  }

  async getShiftForDate(
    workerId: string,
    date: Date,
  ): Promise<{
    name: string;
    isOffDay?: boolean;
    startTime?: string;
    endTime?: string;
  } | null> {
    const worker = await this.prisma.workerProfile.findUnique({
      where: { id: workerId },
      select: { joiningDate: true, rotationPattern: true },
    });

    if (!worker || !worker.rotationPattern) return null;

    const pattern = JSON.parse(worker.rotationPattern);
    const referenceDate = new Date(worker.joiningDate);
    referenceDate.setHours(0, 0, 0, 0);

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(targetDate.getTime() - referenceDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const shiftName = pattern[diffDays % pattern.length];
<<<<<<< HEAD

    if (shiftName === 'Off') return { name: 'Off' };
=======
>>>>>>> main

    if (shiftName === 'Off') return { name: 'Off', isOffDay: true };

    const shift = await this.prisma.shift.findUnique({
      where: { name: shiftName },
    });

    if (!shift) return null;

    return {
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
    };
  }

  async generateScheduleForRange(
    workerId: string,
    startDate: Date,
    endDate: Date,
<<<<<<< HEAD
  ) {
    const schedule: any[] = [];
=======
  ): Promise<ScheduleItem[]> {
    const schedule: ScheduleItem[] = [];
>>>>>>> main
    const current = new Date(startDate);
    while (current <= endDate) {
      const shift = await this.getShiftForDate(workerId, current);
      schedule.push({
        date: new Date(current),
        shift: shift,
      });
      current.setDate(current.getDate() + 1);
    }
    return schedule;
  }

  async getTeamSchedule(
    teamId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TeamScheduleItem[]> {
    const workers = await this.prisma.workerProfile.findMany({
      where: { teamId },
      include: {
        user: { select: { username: true, email: true } },
      },
    });

    const schedule: TeamScheduleItem[] = [];
    for (const worker of workers) {
      const workerSchedule = await this.generateScheduleForRange(
        worker.id,
        startDate,
        endDate,
      );
      schedule.push({
        workerId: worker.id,
        workerName: worker.user.username,
        schedule: workerSchedule,
      });
    }
    return schedule;
  }

  async getDepartmentSchedule(
    departmentId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TeamScheduleItem[]> {
    const workers = await this.prisma.workerProfile.findMany({
      where: { departmentId },
      include: {
        user: { select: { username: true, email: true } },
        team: true,
      },
    });

    const schedule: TeamScheduleItem[] = [];
    for (const worker of workers) {
      const workerSchedule = await this.generateScheduleForRange(
        worker.id,
        startDate,
        endDate,
      );
      schedule.push({
        workerId: worker.id,
        workerName: worker.user.username,
        schedule: workerSchedule,
      });
    }
    return schedule;
  }

  async updateRotationPattern(workerId: string, pattern: string[]) {
    return this.prisma.workerProfile.update({
      where: { id: workerId },
      data: {
        rotationPattern: JSON.stringify(pattern),
      },
    });
  }

  async getWorkerCurrentShift(workerId: string): Promise<{
    name: string;
    isOffDay?: boolean;
    startTime?: string;
    endTime?: string;
  } | null> {
    const today = new Date();
    return this.getShiftForDate(workerId, today);
  }

  async getUpcomingShifts(
    workerId: string,
    days: number = 7,
  ): Promise<ScheduleItem[]> {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);
    return this.generateScheduleForRange(workerId, today, endDate);
  }
}
