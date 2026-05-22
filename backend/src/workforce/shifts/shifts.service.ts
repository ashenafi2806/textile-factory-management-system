import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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

  async findAll() {
    return this.prisma.shift.findMany();
  }

  /**
   * Logical explanation of shift rotation:
   * 1. Get worker's rotation pattern (e.g. '["Morning", "Night", "Off"]')
   * 2. Calculate days since worker's joining date (or a fixed reference date).
   * 3. Apply modulo operator: shift_index = days_elapsed % pattern_length.
   */
  async getShiftForDate(workerId: string, date: Date) {
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

    if (shiftName === 'Off') return { name: 'Off' };

    return this.prisma.shift.findUnique({
      where: { name: shiftName },
    });
  }

  async generateScheduleForRange(
    workerId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const schedule: any[] = [];
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
}
