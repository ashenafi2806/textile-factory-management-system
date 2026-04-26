import { Module } from '@nestjs/common';
import { DepartmentsController } from './departments/departments.controller';
import { DepartmentsService } from './departments/departments.service';
import { WorkersController } from './workers/workers.controller';
import { WorkersService } from './workers/workers.service';
import { ShiftsController } from './shifts/shifts.controller';
import { ShiftsService } from './shifts/shifts.service';
import { AttendanceController } from './attendance/attendance.controller';
import { AttendanceService } from './attendance/attendance.service';
import { LeaveController } from './leave/leave.controller';
import { LeaveService } from './leave/leave.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [
    DepartmentsController,
    WorkersController,
    ShiftsController,
    AttendanceController,
    LeaveController,
  ],
  providers: [
    DepartmentsService,
    WorkersService,
    ShiftsService,
    AttendanceService,
    LeaveService,
  ],
})
export class WorkforceModule {}
