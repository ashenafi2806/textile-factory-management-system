/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AttendanceStatus, Attendance } from '@prisma/client';
import logger from '../../logger';

type DisplayStatus = 'Present' | 'Absent' | 'Late' | 'On Leave';

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

function toDisplayStatus(
  status: AttendanceStatus | null | undefined,
  isLate?: boolean,
): DisplayStatus {
  if (status === 'ON_LEAVE') return 'On Leave';
  if (status === 'ABSENT') return 'Absent';
  if (status === 'LATE' || isLate) return 'Late';
  return 'Present';
}

function buildDateTimeFromShift(date: Date, time: string): Date {
  const [hh, mm] = time.split(':').map((x) => parseInt(x, 10));
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      hh || 0,
      mm || 0,
      0,
    ),
  );
}

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  // Find the effective attendance policy for a worker (department-scoped, fallback to global)
  private async findEffectivePolicyForWorker(workerId: string) {
    const worker = await this.prisma.workerProfile.findUnique({
      where: { id: workerId },
      select: { department: true },
    });

    if (!worker) return null;

    if (worker.department) {
      const deptPolicy = await this.prisma.attendancePolicy.findFirst({
        where: { department: worker.department },
        orderBy: { createdAt: 'desc' },
      });
      if (deptPolicy) return deptPolicy;
    }

    const globalPolicy = await this.prisma.attendancePolicy.findFirst({
      where: { department: null },
      orderBy: { createdAt: 'desc' },
    });

    return globalPolicy;
  }

  // Compute policy-derived fields given a policy and attendance times
  private computeDerivedFields(
    policy: any,
    date: Date,
    checkIn?: Date,
    checkOut?: Date,
    shiftStartTime?: string,
    shiftEndTime?: string,
  ) {
    const result: any = {
      isLate: false,
      lateMinutes: null,
      isEarlyLeave: false,
      earlyMinutes: null,
      policyId: policy?.id ?? null,
    };

    const parseTime = (s?: string) => {
      if (!s) return null;
      const [hh, mm] = s.split(':').map((x) => parseInt(x, 10));
      if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
      return { hh, mm };
    };

    const start = parseTime(policy?.workdayStart ?? shiftStartTime);
    const end = parseTime(policy?.workdayEnd ?? shiftEndTime);

    try {
      if (checkIn && start) {
        const expectedStart = Date.UTC(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          date.getUTCDate(),
          start.hh,
          start.mm,
          0,
        );
        const checkInMillis = checkIn.getTime();
        const diffMinutes = Math.round((checkInMillis - expectedStart) / 60000);
        const adjusted = diffMinutes - (policy.gracePeriodMinutes ?? 0);
        if (adjusted > (policy.lateThresholdMinutes ?? 0)) {
          result.isLate = true;
          result.lateMinutes = adjusted;
        } else if (adjusted > 0) {
          // small lateness within threshold still record minutes
          result.isLate = adjusted > 0;
          result.lateMinutes = adjusted > 0 ? adjusted : null;
        }
      }

      if (checkOut && end) {
        const expectedEnd = Date.UTC(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          date.getUTCDate(),
          end.hh,
          end.mm,
          0,
        );
        const checkOutMillis = checkOut.getTime();
        const diffMinutes = Math.round((expectedEnd - checkOutMillis) / 60000);
        const adjusted = diffMinutes - (policy.gracePeriodMinutes ?? 0);
        if (adjusted > (policy.earlyLeaveThresholdMinutes ?? 0)) {
          result.isEarlyLeave = true;
          result.earlyMinutes = adjusted;
        } else if (adjusted > 0) {
          result.isEarlyLeave = adjusted > 0;
          result.earlyMinutes = adjusted > 0 ? adjusted : null;
        }
      }
    } catch (e) {
      // swallow and return defaults
    }

    return result;
  }

  async recordAttendance(data: {
    workerId: string;
    date: Date;
    checkIn?: Date;
    checkOut?: Date;
    status?: AttendanceStatus;
    recordedById: string;
  }) {
    const d = new Date(data.date);
    const startOfDay = startOfDayUTC(d);
    const endOfDay = endOfDayUTC(d);

    const existing = await this.prisma.attendance.findFirst({
      where: {
        workerId: data.workerId,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    const status = data.status ?? AttendanceStatus.PRESENT;

    if (status === AttendanceStatus.ABSENT || status === AttendanceStatus.ON_LEAVE) {
      const payload = {
        workerId: data.workerId,
        date: startOfDay,
        status,
        checkIn: null,
        checkOut: null,
        recordedById: data.recordedById,
        isLate: false,
        lateMinutes: null,
        isEarlyLeave: false,
        earlyMinutes: null,
      };
      if (existing) {
        return this.prisma.attendance.update({
          where: { id: existing.id },
          data: payload,
        });
      }
      return this.prisma.attendance.create({ data: payload });
    }

    const shift = await this.prisma.shiftAssignment.findFirst({
      where: {
        workerId: data.workerId,
        startDate: { lte: endOfDay },
        endDate: { gte: startOfDay },
      },
      include: { shift: true },
    });

    const checkIn =
      data.checkIn ??
      (shift?.shift.startTime
        ? buildDateTimeFromShift(d, shift.shift.startTime)
        : new Date());
    const checkOut =
      data.checkOut ??
      (shift?.shift.endTime
        ? buildDateTimeFromShift(d, shift.shift.endTime)
        : undefined);

    const policy = await this.findEffectivePolicyForWorker(data.workerId);
    const derived = this.computeDerivedFields(
      policy,
      d,
      checkIn,
      checkOut,
      shift?.shift.startTime,
      shift?.shift.endTime,
    );

    const resolvedStatus =
      status === AttendanceStatus.LATE || derived.isLate
        ? AttendanceStatus.LATE
        : AttendanceStatus.PRESENT;

    const recordData = {
      checkIn,
      checkOut,
      status: resolvedStatus,
      recordedById: data.recordedById,
      isLate: derived.isLate,
      lateMinutes: derived.lateMinutes ?? undefined,
      isEarlyLeave: derived.isEarlyLeave,
      earlyMinutes: derived.earlyMinutes ?? undefined,
      policyId: derived.policyId ?? undefined,
    };

    if (existing) {
      return this.prisma.attendance.update({
        where: { id: existing.id },
        data: recordData,
      });
    }

    return this.prisma.attendance.create({
      data: {
        workerId: data.workerId,
        date: startOfDay,
        ...recordData,
      },
    });
  }

  async upsertLeaveAttendance(workerId: string, startDate: Date, endDate: Date) {
    const start = startOfDayUTC(startDate);
    const end = startOfDayUTC(endDate);
    const current = new Date(start);
    const results: Attendance[] = [];

    while (current <= end) {
      const day = startOfDayUTC(current);
      const existing = await this.prisma.attendance.findFirst({
        where: { workerId, date: day },
      });
      if (existing) {
        results.push(
          await this.prisma.attendance.update({
            where: { id: existing.id },
            data: {
              status: AttendanceStatus.ON_LEAVE,
              checkIn: null,
              checkOut: null,
              isLate: false,
              lateMinutes: null,
            },
          }),
        );
      } else {
        results.push(
          await this.prisma.attendance.create({
            data: {
              workerId,
              date: day,
              status: AttendanceStatus.ON_LEAVE,
              checkIn: null,
              checkOut: null,
            },
          }),
        );
      }
      current.setUTCDate(current.getUTCDate() + 1);
    }
    return results;
  }

  async updateAttendance(
    id: string,
    data: {
      checkIn?: Date;
      checkOut?: Date;
      recordedById?: string;
      status?: AttendanceStatus;
    },
  ) {
    const updateData: any = {};
    if (data.checkIn !== undefined) updateData.checkIn = data.checkIn;
    if (data.checkOut !== undefined) updateData.checkOut = data.checkOut;
    if (data.recordedById) updateData.recordedById = data.recordedById;
    if (data.status) updateData.status = data.status;

    const existing = await this.prisma.attendance.findUnique({ where: { id } });
    if (!existing) return null;

    if (
      data.status === AttendanceStatus.ABSENT ||
      data.status === AttendanceStatus.ON_LEAVE
    ) {
      updateData.checkIn = null;
      updateData.checkOut = null;
      updateData.isLate = false;
      updateData.lateMinutes = null;
      return this.prisma.attendance.update({ where: { id }, data: updateData });
    }

    if (data.checkIn || data.checkOut || data.status) {
      const policy = await this.findEffectivePolicyForWorker(existing.workerId);
      const checkIn = data.checkIn ?? existing.checkIn ?? undefined;
      const checkOut = data.checkOut ?? existing.checkOut ?? undefined;
      const derived = this.computeDerivedFields(
        policy,
        existing.date,
        checkIn,
        checkOut,
      );
      updateData.isLate = derived.isLate;
      updateData.lateMinutes = derived.lateMinutes ?? undefined;
      updateData.isEarlyLeave = derived.isEarlyLeave;
      updateData.earlyMinutes = derived.earlyMinutes ?? undefined;
      updateData.policyId = derived.policyId ?? undefined;
      if (!data.status) {
        updateData.status = derived.isLate
          ? AttendanceStatus.LATE
          : AttendanceStatus.PRESENT;
      }
    }

    return this.prisma.attendance.update({ where: { id }, data: updateData });
  }

  async deleteAttendance(id: string) {
    return this.prisma.attendance.delete({ where: { id } });
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
    // Use UTC day boundaries to match how frontend provides date-only values
    const d = new Date(date);
    const startOfDay = new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0),
    );
    const endOfDay = new Date(
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

    const whereCondition: any = {
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

      if (manager?.workerProfile?.department) {
        whereCondition.worker.department = manager.workerProfile.department;
      }
    }

    const results = await this.prisma.attendance.findMany({
      where: whereCondition,
      include: {
        worker: {
          include: {
            user: { select: { username: true, email: true } },
          },
        },
        recordedBy: { select: { username: true } },
      },
    });

    try {
      logger.info('attendance.getTeam.result', {
        teamId,
        date: startOfDay.toISOString(),
        count: results.length,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('logger error', e);
    }

    return results;
  }

  async getAttendanceForDate(
    date: Date,
    managerId?: string,
    shiftId?: string,
  ) {
    const startOfDay = startOfDayUTC(date);
    const endOfDay = endOfDayUTC(date);

    let department: string | undefined;
    if (managerId) {
      const manager = await this.prisma.user.findUnique({
        where: { id: managerId },
        include: { workerProfile: true },
      });
      department = manager?.workerProfile?.department || undefined;
    }

    let workerIdsForShift: Set<string> | null = null;
    if (shiftId) {
      const assignments = await this.prisma.shiftAssignment.findMany({
        where: {
          shiftId,
          startDate: { lte: endOfDay },
          endDate: { gte: startOfDay },
        },
        select: { workerId: true },
      });
      workerIdsForShift = new Set(assignments.map((a) => a.workerId));
    }

    const workersWhere: any = {};
    if (department) workersWhere.department = department;
    if (workerIdsForShift) {
      workersWhere.id = { in: [...workerIdsForShift] };
    }

    const workers = await this.prisma.workerProfile.findMany({
      where: workersWhere,
      include: { user: { select: { username: true, email: true } } },
      orderBy: [{ department: 'asc' }, { fullName: 'asc' }, { employeeId: 'asc' }],
    });

    const attendanceWhere: any = {
      date: { gte: startOfDay, lte: endOfDay },
    };
    if (department) attendanceWhere.worker = { department };
    if (workerIdsForShift) {
      attendanceWhere.workerId = { in: [...workerIdsForShift] };
    }

    const attendance = await this.prisma.attendance.findMany({
      where: attendanceWhere,
      include: { recordedBy: { select: { username: true } } },
    });
    const attendanceByWorker = new Map(
      attendance.map((a) => [a.workerId, a]),
    );

    const leaveWhere: any = {
      status: 'APPROVED',
      startDate: { lte: endOfDay },
      endDate: { gte: startOfDay },
    };
    if (department) leaveWhere.worker = { department };
    if (workerIdsForShift) leaveWhere.workerId = { in: [...workerIdsForShift] };

    const leaves = await this.prisma.leaveRequest.findMany({
      where: leaveWhere,
      select: { workerId: true },
    });
    const onLeave = new Set(leaves.map((l) => l.workerId));

    const workerIds = workers.map((w) => w.id);
    const shiftAssignments = await this.prisma.shiftAssignment.findMany({
      where: {
        workerId: { in: workerIds },
        startDate: { lte: endOfDay },
        endDate: { gte: startOfDay },
      },
      include: { shift: true },
    });
    const shiftByWorker = new Map(
      shiftAssignments.map((sa) => [sa.workerId, sa.shift]),
    );

    const results = workers.map((w) => {
      const att = attendanceByWorker.get(w.id) ?? null;
      const assignedShift = shiftByWorker.get(w.id) ?? null;

      let status: DisplayStatus = 'Present';
      if (att) {
        status = toDisplayStatus(att.status, att.isLate);
      } else if (onLeave.has(w.id)) {
        status = 'On Leave';
      }

      return {
        workerId: w.id,
        worker: w,
        attendance: att,
        status,
        shift: assignedShift
          ? {
              id: assignedShift.id,
              name: assignedShift.name,
              startTime: assignedShift.startTime,
              endTime: assignedShift.endTime,
            }
          : null,
      };
    });

    return results;
  }

  async getAttendanceReport(options: {
    startDate: Date;
    endDate: Date;
    shiftId?: string;
    department?: string;
    managerId?: string;
  }) {
    const start = startOfDayUTC(options.startDate);
    const end = startOfDayUTC(options.endDate);

    let department = options.department;
    if (options.managerId && !department) {
      const manager = await this.prisma.user.findUnique({
        where: { id: options.managerId },
        include: { workerProfile: true },
      });
      department = manager?.workerProfile?.department || undefined;
    }

    let workerIdsFilter: string[] | undefined;
    if (options.shiftId) {
      const assignments = await this.prisma.shiftAssignment.findMany({
        where: {
          shiftId: options.shiftId,
          startDate: { lte: endOfDayUTC(end) },
          endDate: { gte: start },
        },
        select: { workerId: true },
      });
      workerIdsFilter = [...new Set(assignments.map((a) => a.workerId))];
    }

    const workersWhere: any = {};
    if (department) workersWhere.department = department;
    if (workerIdsFilter) workersWhere.id = { in: workerIdsFilter };

    const workers = await this.prisma.workerProfile.findMany({
      where: workersWhere,
      include: { user: { select: { username: true } } },
    });

    const attendanceWhere: any = {
      date: { gte: start, lte: endOfDayUTC(end) },
    };
    if (department) attendanceWhere.worker = { department };
    if (workerIdsFilter) attendanceWhere.workerId = { in: workerIdsFilter };

    const records = await this.prisma.attendance.findMany({
      where: attendanceWhere,
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
    });

    const summary = {
      present: 0,
      absent: 0,
      late: 0,
      onLeave: 0,
      totalRecords: records.length,
    };

    records.forEach((r) => {
      const display = toDisplayStatus(r.status, r.isLate);
      if (display === 'Present') summary.present++;
      else if (display === 'Absent') summary.absent++;
      else if (display === 'Late') summary.late++;
      else if (display === 'On Leave') summary.onLeave++;
    });

    const dailyMap = new Map<
      string,
      { present: number; absent: number; late: number; onLeave: number }
    >();

    records.forEach((r) => {
      const key = startOfDayUTC(r.date).toISOString().slice(0, 10);
      if (!dailyMap.has(key)) {
        dailyMap.set(key, { present: 0, absent: 0, late: 0, onLeave: 0 });
      }
      const bucket = dailyMap.get(key)!;
      const display = toDisplayStatus(r.status, r.isLate);
      if (display === 'Present') bucket.present++;
      else if (display === 'Absent') bucket.absent++;
      else if (display === 'Late') bucket.late++;
      else if (display === 'On Leave') bucket.onLeave++;
    });

    const dailyBreakdown = [...dailyMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts }));

    const byWorkerMap = new Map<
      string,
      {
        workerId: string;
        workerName: string;
        employeeId: string | null;
        department: string | null;
        present: number;
        absent: number;
        late: number;
        onLeave: number;
      }
    >();

    workers.forEach((w) => {
      byWorkerMap.set(w.id, {
        workerId: w.id,
        workerName: w.fullName || w.user?.username || w.employeeId || w.id,
        employeeId: w.employeeId,
        department: w.department,
        present: 0,
        absent: 0,
        late: 0,
        onLeave: 0,
      });
    });

    records.forEach((r) => {
      const entry = byWorkerMap.get(r.workerId);
      if (!entry) return;
      const display = toDisplayStatus(r.status, r.isLate);
      if (display === 'Present') entry.present++;
      else if (display === 'Absent') entry.absent++;
      else if (display === 'Late') entry.late++;
      else if (display === 'On Leave') entry.onLeave++;
    });

    const byWorker = [...byWorkerMap.values()].map((w) => {
      const total = w.present + w.absent + w.late + w.onLeave;
      return {
        ...w,
        total,
        attendanceRate: total > 0 ? Math.round(((w.present + w.late) / total) * 100) : 0,
      };
    });

    const deptMap = new Map<
      string,
      { department: string; present: number; absent: number; late: number; onLeave: number }
    >();
    byWorker.forEach((w) => {
      const dept = w.department || 'Unassigned';
      if (!deptMap.has(dept)) {
        deptMap.set(dept, { department: dept, present: 0, absent: 0, late: 0, onLeave: 0 });
      }
      const d = deptMap.get(dept)!;
      d.present += w.present;
      d.absent += w.absent;
      d.late += w.late;
      d.onLeave += w.onLeave;
    });

    const totalMarked = summary.present + summary.absent + summary.late + summary.onLeave;

    return {
      period: { start: start.toISOString(), end: end.toISOString() },
      scope: { department: department ?? null, shiftId: options.shiftId ?? null },
      summary: {
        ...summary,
        totalWorkers: workers.length,
        attendanceRate:
          totalMarked > 0
            ? Math.round(((summary.present + summary.late) / totalMarked) * 100)
            : 0,
      },
      dailyBreakdown,
      byWorker: byWorker.sort((a, b) => b.total - a.total),
      byDepartment: [...deptMap.values()],
    };
  }

  async getAttendanceAnalytics(
    managerId?: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    let department: string | undefined;

    if (managerId) {
      const manager = await this.prisma.user.findUnique({
        where: { id: managerId },
        include: { workerProfile: true },
      });
      department = manager?.workerProfile?.department || undefined;
    }

    const whereCondition: any = {};

    if (department) {
      whereCondition.worker = { department };
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
      where: department ? { department } : {},
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
