/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Shift, ShiftAssignment } from '@prisma/client';

export interface ScheduleItem {
  date: Date;
  shift: {
    id?: string;
    name?: string;
    startTime?: string;
    endTime?: string;
    startDate?: Date;
    endDate?: Date;
    isOffDay?: boolean;
  } | null;
}

export interface WorkerShiftView {
  assignmentId: string;
  shiftId: string;
  name: string;
  startTime: string;
  endTime: string;
  startDate: Date;
  endDate: Date;
  description?: string | null;
}

export interface TeamScheduleItem {
  workerId: string;
  workerName: string;
  schedule: ScheduleItem[];
}

function parseDateOnly(value: string | Date): Date {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00.000Z`);
  }
  const d = new Date(value);
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0),
  );
}

function startOfDayUTC(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0),
  );
}

function endOfDayUTC(d: Date): Date {
  return new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
}

@Injectable()
export class ShiftsService {
  constructor(private prisma: PrismaService) {}

  private async purgeExpiredShifts() {
    const today = startOfDayUTC(new Date());
    await this.prisma.shift.deleteMany({
      where: { endDate: { lt: today } },
    });
  }

  async createShift(data: {
    name: string;
    startTime: string;
    endTime: string;
    startDate: string | Date;
    endDate: string | Date;
    description?: string;
  }) {
    const startDate = parseDateOnly(data.startDate);
    const endDate = parseDateOnly(data.endDate);
    if (endDate < startDate) {
      throw new BadRequestException('End date must be on or after start date');
    }
    return this.prisma.shift.create({
      data: {
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        startDate,
        endDate,
        description: data.description,
      },
    });
  }

  async updateShift(
    id: string,
    data: {
      name?: string;
      startTime?: string;
      endTime?: string;
      startDate?: string | Date;
      endDate?: string | Date;
      description?: string;
    },
  ) {
    const existing = await this.prisma.shift.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Shift not found');

    const startDate = data.startDate
      ? parseDateOnly(data.startDate)
      : existing.startDate;
    const endDate = data.endDate
      ? parseDateOnly(data.endDate)
      : existing.endDate;
    if (endDate < startDate) {
      throw new BadRequestException('End date must be on or after start date');
    }

    const updated = await this.prisma.shift.update({
      where: { id },
      data: {
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        startDate,
        endDate,
        description: data.description,
      },
    });

    await this.prisma.shiftAssignment.updateMany({
      where: { shiftId: id },
      data: { startDate, endDate },
    });

    return updated;
  }

  async deleteShift(id: string) {
    const existing = await this.prisma.shift.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Shift not found');
    return this.prisma.shift.delete({ where: { id } });
  }

  async findAll(): Promise<
    (Shift & { assignments: (ShiftAssignment & { worker: { id: string; fullName: string | null; employeeId: string | null; department: string | null } })[] })[]
  > {
    await this.purgeExpiredShifts();
    return this.prisma.shift.findMany({
      include: {
        assignments: {
          include: {
            worker: {
              select: {
                id: true,
                fullName: true,
                employeeId: true,
                department: true,
              },
            },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(id: string) {
    await this.purgeExpiredShifts();
    const shift = await this.prisma.shift.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            worker: {
              select: {
                id: true,
                fullName: true,
                employeeId: true,
                department: true,
                user: { select: { username: true, email: true } },
              },
            },
          },
        },
      },
    });
    if (!shift) throw new NotFoundException('Shift not found');
    return shift;
  }

  async getShiftForDate(
    workerId: string,
    date: Date,
  ): Promise<{
    id?: string;
    name: string;
    startTime?: string;
    endTime?: string;
    isOffDay?: boolean;
  } | null> {
    const assigned = await this.getAssignedShiftForDate(workerId, date);
    if (assigned) {
      return {
        id: assigned.id,
        name: assigned.name,
        startTime: assigned.startTime,
        endTime: assigned.endTime,
      };
    }
    return null;
  }

  async generateScheduleForRange(
    workerId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ScheduleItem[]> {
    const schedule: ScheduleItem[] = [];
    const current = startOfDayUTC(startDate);
    const end = startOfDayUTC(endDate);
    while (current <= end) {
      const shift = await this.getShiftForDate(workerId, current);
      schedule.push({
        date: new Date(current),
        shift: shift
          ? {
              id: shift.id,
              name: shift.name,
              startTime: shift.startTime,
              endTime: shift.endTime,
            }
          : null,
      });
      current.setUTCDate(current.getUTCDate() + 1);
    }
    return schedule;
  }

  async getTeamSchedule(
    teamId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TeamScheduleItem[]> {
    const workers = await this.prisma.workerProfile.findMany({
      where: { department: teamId },
      include: { user: { select: { username: true, email: true } } },
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
        workerName: worker.fullName || worker.user.username,
        schedule: workerSchedule,
      });
    }
    return schedule;
  }

  async getDepartmentSchedule(
    department: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TeamScheduleItem[]> {
    return this.getTeamSchedule(department, startDate, endDate);
  }

  async updateRotationPattern(workerId: string, pattern: string[]) {
    return this.prisma.workerProfile.update({
      where: { id: workerId },
      data: { rotationPattern: JSON.stringify(pattern) },
    });
  }

  async getWorkerCurrentShift(workerId: string): Promise<WorkerShiftView | null> {
    const today = new Date();
    const assignment = await this.prisma.shiftAssignment.findFirst({
      where: {
        workerId,
        startDate: { lte: endOfDayUTC(today) },
        endDate: { gte: startOfDayUTC(today) },
      },
      include: { shift: true },
      orderBy: { startDate: 'desc' },
    });
    if (!assignment) return null;
    return this.toWorkerShiftView(assignment);
  }

  async getUpcomingShifts(
    workerId: string,
    days: number = 30,
  ): Promise<WorkerShiftView[]> {
    const today = startOfDayUTC(new Date());
    const end = new Date(today);
    end.setUTCDate(end.getUTCDate() + days);

    const assignments = await this.prisma.shiftAssignment.findMany({
      where: {
        workerId,
        endDate: { gte: today },
        startDate: { lte: end },
      },
      include: { shift: true },
      orderBy: { startDate: 'asc' },
    });

    return assignments.map((a) => this.toWorkerShiftView(a));
  }

  private toWorkerShiftView(
    assignment: ShiftAssignment & { shift: Shift },
  ): WorkerShiftView {
    return {
      assignmentId: assignment.id,
      shiftId: assignment.shiftId,
      name: assignment.shift.name,
      startTime: assignment.shift.startTime,
      endTime: assignment.shift.endTime,
      startDate: assignment.startDate,
      endDate: assignment.endDate,
      description: assignment.shift.description,
    };
  }

  async assignShift(
    workerId: string,
    shiftId: string,
    createdById?: string,
    startDateOverride?: string | Date,
    endDateOverride?: string | Date,
  ): Promise<ShiftAssignment> {
    const shift = await this.prisma.shift.findUnique({ where: { id: shiftId } });
    if (!shift) throw new NotFoundException('Shift not found');

    const startDate = startDateOverride
      ? parseDateOnly(startDateOverride)
      : shift.startDate;
    const endDate = endDateOverride
      ? parseDateOnly(endDateOverride)
      : shift.endDate;

    const overlapping = await this.prisma.shiftAssignment.findFirst({
      where: {
        workerId,
        shiftId,
        startDate,
      },
    });
    if (overlapping) {
      return this.prisma.shiftAssignment.update({
        where: { id: overlapping.id },
        data: { endDate, createdById },
      });
    }

    return this.prisma.shiftAssignment.create({
      data: {
        workerId,
        shiftId,
        startDate,
        endDate,
        createdById,
      },
    });
  }

  async bulkAssignWorkers(
    shiftId: string,
    workerIds: string[],
    createdById?: string,
  ) {
    const results: ShiftAssignment[] = [];
    for (const workerId of workerIds) {
      const assignment = await this.assignShift(workerId, shiftId, createdById);
      results.push(assignment);
    }
    return results;
  }

  async updateWorkerAssignment(
    assignmentId: string,
    shiftId: string,
    createdById?: string,
  ) {
    const existing = await this.prisma.shiftAssignment.findUnique({
      where: { id: assignmentId },
    });
    if (!existing) throw new NotFoundException('Assignment not found');
    const shift = await this.prisma.shift.findUnique({ where: { id: shiftId } });
    if (!shift) throw new NotFoundException('Shift not found');

    return this.prisma.shiftAssignment.update({
      where: { id: assignmentId },
      data: {
        shiftId,
        startDate: shift.startDate,
        endDate: shift.endDate,
        createdById,
      },
      include: { shift: true, worker: true },
    });
  }

  async unassignShift(assignmentId: string) {
    return this.prisma.shiftAssignment.delete({ where: { id: assignmentId } });
  }

  async getAssignmentsForWorker(workerId: string, start?: Date, end?: Date) {
    const where: any = { workerId };
    if (start && end) {
      where.startDate = { lte: endOfDayUTC(end) };
      where.endDate = { gte: startOfDayUTC(start) };
    } else if (start) {
      where.endDate = { gte: startOfDayUTC(start) };
    } else if (end) {
      where.startDate = { lte: endOfDayUTC(end) };
    }

    return this.prisma.shiftAssignment.findMany({
      where,
      include: { shift: true },
      orderBy: { startDate: 'asc' },
    });
  }

  async getWorkersForShiftOnDate(shiftId: string, date: Date) {
    const dayStart = startOfDayUTC(date);
    const dayEnd = endOfDayUTC(date);
    const assignments = await this.prisma.shiftAssignment.findMany({
      where: {
        shiftId,
        startDate: { lte: dayEnd },
        endDate: { gte: dayStart },
      },
      include: {
        worker: {
          include: { user: { select: { username: true, email: true } } },
        },
      },
    });
    return assignments.map((a) => a.worker);
  }

  async getAssignedShiftForDate(workerId: string, date: Date) {
    const dayStart = startOfDayUTC(date);
    const dayEnd = endOfDayUTC(date);
    const assignment = await this.prisma.shiftAssignment.findFirst({
      where: {
        workerId,
        startDate: { lte: dayEnd },
        endDate: { gte: dayStart },
      },
      include: { shift: true },
      orderBy: { startDate: 'desc' },
    });
    if (!assignment) return null;
    return assignment.shift;
  }
}
