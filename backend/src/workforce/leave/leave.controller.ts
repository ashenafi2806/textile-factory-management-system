<<<<<<< HEAD
=======
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
>>>>>>> main
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
<<<<<<< HEAD
=======
  ForbiddenException,
>>>>>>> main
} from '@nestjs/common';
import { LeaveService } from './leave.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { LeaveStatus } from '@prisma/client';

@Controller('workforce/leave')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveController {
  constructor(private leaveService: LeaveService) {}

  @Post('request')
  @Roles('WORKER', 'SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'ADMIN')
  request(@CurrentUser() user: any, @Body() data: any) {
    // Get worker profile ID from user
    return this.leaveService.requestLeave({
      workerId: user.workerProfileId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      reason: data.reason,
    });
  }

  @Get('pending')
  @Roles('MANAGER', 'HR_ADMIN', 'ADMIN', 'SUPERVISOR')
  findPending(@CurrentUser() user: any) {
    if (user.roles.includes('MANAGER')) {
      return this.leaveService.findPendingForManager(user.userId);
    }
    return this.leaveService.findPending();
  }

  @Get('my-leaves')
  @Roles('WORKER', 'SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'ADMIN')
  getMyLeaves(@CurrentUser() user: any) {
    return this.leaveService.getEmployeeLeaveHistory(user.workerProfileId);
  }

  @Put(':id/approve')
  @Roles('MANAGER', 'ADMIN', 'SUPERVISOR')
  async approve(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('status') status: LeaveStatus,
  ) {
    // Verify this leave belongs to manager's team
    if (user.roles.includes('MANAGER')) {
      const canApprove = await this.leaveService.canManagerApprove(
        id,
        user.userId,
      );
      if (!canApprove) {
        throw new ForbiddenException(
          'Cannot approve leave for workers outside your team',
        );
      }
    }
    return this.leaveService.approveLeave(id, user.userId, status);
  }

  @Get('analytics')
  @Roles('MANAGER', 'ADMIN', 'HR_ADMIN', 'SUPERVISOR')
  getAnalytics(@CurrentUser() user: any) {
    if (user.roles.includes('MANAGER')) {
      return this.leaveService.getWorkforceAnalytics(user.userId);
    }
    return this.leaveService.getWorkforceAnalytics();
  }
}
