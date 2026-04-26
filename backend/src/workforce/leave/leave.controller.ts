import { Controller, Get, Post, Body, Param, Put, UseGuards } from '@nestjs/common';
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
  request(@Body() data: any) {
    return this.leaveService.requestLeave({
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    });
  }

  @Get('pending')
  @Roles('MANAGER', 'HR_ADMIN', 'ADMIN')
  findPending() {
    return this.leaveService.findPending();
  }

  @Put(':id/approve')
  @Roles('MANAGER', 'ADMIN')
  approve(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('status') status: LeaveStatus,
  ) {
    return this.leaveService.approveLeave(id, user.id, status);
  }

  @Get('analytics')
  @Roles('MANAGER', 'ADMIN', 'HR_ADMIN')
  getAnalytics() {
    return this.leaveService.getWorkforceAnalytics();
  }
}
