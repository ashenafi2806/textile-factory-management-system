/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/require-await */
import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StaffingService } from './staffing.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@ApiTags('workforce/staffing')
@ApiBearerAuth('jwt')
@Controller('workforce/staffing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffingController {
  constructor(private staffingService: StaffingService) {}

  @ApiOperation({ summary: 'Manager staffing dashboard' })
  @ApiResponse({ status: 200, description: 'Dashboard data' })
  @Get('dashboard')
  @Roles('MANAGER', 'HR_ADMIN', 'ADMIN')
  async getStaffingDashboard(@CurrentUser() user: any) {
    if (user.roles.includes('MANAGER')) {
      return this.staffingService.getDashboardForManager(user.userId);
    }
    return { message: 'Admin dashboard not implemented yet' };
  }

  @ApiOperation({ summary: 'Identify staffing gaps' })
  @ApiResponse({ status: 200, description: 'Array of gaps' })
  @Get('gaps')
  @Roles('MANAGER', 'HR_ADMIN', 'ADMIN')
  async identifyGaps(@CurrentUser() user: any) {
    if (user.roles.includes('MANAGER')) {
      return this.staffingService.findGapsForManager(user.userId);
    }
    return { message: 'Admin view not implemented yet' };
  }

  @ApiOperation({ summary: 'Headcount summary' })
  @ApiResponse({ status: 200, description: 'Headcount data' })
  @Get('headcount')
  @Roles('MANAGER', 'HR_ADMIN', 'ADMIN')
  async getHeadcount(@CurrentUser() user: any) {
    if (user.roles.includes('MANAGER')) {
      return this.staffingService.getHeadcountForManager(user.userId);
    }
    return { message: 'Admin view not implemented yet' };
  }
}
