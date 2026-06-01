/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { LeaveService } from './leave.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RequestLeaveDto, ApproveLeaveDto } from './dto/leave.dto';

@ApiTags('workforce/leave')
@ApiBearerAuth('jwt')
@Controller('workforce/leave')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveController {
  constructor(private leaveService: LeaveService) {}

  @ApiOperation({ summary: 'Submit a new leave request' })
  @ApiBody({ type: RequestLeaveDto })
  @ApiResponse({ status: 201, description: 'Leave request created' })
  @Post('request')
  @Roles('WORKER', 'SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'ADMIN')
  request(@CurrentUser() user: any, @Body() data: RequestLeaveDto) {
    return this.leaveService.requestLeave({
      workerId: user.workerProfileId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      reason: data.reason,
    });
  }

  @ApiOperation({ summary: 'List pending leave requests' })
  @ApiResponse({ status: 200, description: 'Array of pending leaves' })
  @Get('pending')
  @Roles('MANAGER', 'HR_ADMIN', 'ADMIN', 'SUPERVISOR')
  findPending(@CurrentUser() user: any) {
    if (user.roles.includes('MANAGER')) {
      return this.leaveService.findPendingForManager(user.userId);
    }
    return this.leaveService.findPending();
  }

  @ApiOperation({ summary: 'Get my own leave history' })
  @ApiResponse({ status: 200, description: 'Array of leave requests' })
  @Get('my-leaves')
  @Roles('WORKER', 'SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'ADMIN')
  getMyLeaves(@CurrentUser() user: any) {
    return this.leaveService.getEmployeeLeaveHistory(user.workerProfileId);
  }

  @ApiOperation({ summary: 'Approve or reject a leave request' })
  @ApiParam({ name: 'id', description: 'Leave UUID' })
  @ApiBody({ type: ApproveLeaveDto })
  @ApiResponse({ status: 200, description: 'Leave status updated' })
  @Put(':id/approve')
  @Roles('MANAGER', 'ADMIN', 'SUPERVISOR')
  async approve(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: ApproveLeaveDto,
  ) {
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
    return this.leaveService.approveLeave(id, user.userId, body.status);
  }

  @ApiOperation({ summary: 'Workforce / leave analytics' })
  @ApiResponse({ status: 200, description: 'Analytics payload' })
  @Get('analytics')
  @Roles('MANAGER', 'ADMIN', 'HR_ADMIN', 'SUPERVISOR')
  getAnalytics(@CurrentUser() user: any) {
    if (user.roles.includes('MANAGER')) {
      return this.leaveService.getWorkforceAnalytics(user.userId);
    }
    return this.leaveService.getWorkforceAnalytics();
  }
}
