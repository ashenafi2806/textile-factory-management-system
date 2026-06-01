import { Module } from '@nestjs/common';

import { WorkersController } from './workers/workers.controller';
import { WorkersService } from './workers/workers.service';
import { ShiftsController } from './shifts/shifts.controller';
import { ShiftsService } from './shifts/shifts.service';
import { AttendanceController } from './attendance/attendance.controller';
import { AttendanceService } from './attendance/attendance.service';
import { LeaveController } from './leave/leave.controller';
import { LeaveService } from './leave/leave.service';
import { StaffingController } from './staffing/staffing.controller';
import { StaffingService } from './staffing/staffing.service';
import { OvertimeController } from './overtime/overtime.controller';
import { OvertimeService } from './overtime/overtime.service';
import { HiringController } from './hiring/hiring.controller';
import { HiringService } from './hiring/hiring.service';
import { IncidentsController } from './incidents/incidents.controller';
import { IncidentsService } from './incidents/incidents.service';
import { PoliciesController } from './policies/policies.controller';
import { PoliciesService } from './policies/policies.service';
import { DisciplineController } from './discipline/discipline.controller';
import { DisciplineService } from './discipline/discipline.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [
    WorkersController,
    ShiftsController,
    AttendanceController,
    LeaveController,
    StaffingController,
    // Overtime + Hiring (dev stubs)
    OvertimeController,
    HiringController,
    // Attendance policy management
    PoliciesController,
    // Incidents (dev stub)
    IncidentsController,
    // Disciplinary actions
    DisciplineController,
  ],
  providers: [
    WorkersService,
    ShiftsService,
    AttendanceService,
    LeaveService,
    StaffingService,
    // Overtime + Hiring services (dev stubs)
    OvertimeService,
    HiringService,
    // Attendance policy management
    PoliciesService,
    // Incidents service (dev stub)
    IncidentsService,
    // Disciplinary actions
    DisciplineService,
  ],
})
export class WorkforceModule {}
