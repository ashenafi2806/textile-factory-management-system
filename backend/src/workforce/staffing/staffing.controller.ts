/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/require-await */
import { Controller, Get, UseGuards } from '@nestjs/common';
import { StaffingService } from './staffing.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller('workforce/staffing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffingController {
  constructor(private staffingService: StaffingService) {}

  @Get('dashboard')
  @Roles('MANAGER', 'HR_ADMIN', 'ADMIN')
  async getStaffingDashboard(@CurrentUser() user: any) {
    if (user.roles.includes('MANAGER')) {
      return this.staffingService.getDashboardForManager(user.userId);
    }
    return { message: 'Admin dashboard not implemented yet' };
  }

  @Get('gaps')
  @Roles('MANAGER', 'HR_ADMIN', 'ADMIN')
  async identifyGaps(@CurrentUser() user: any) {
    if (user.roles.includes('MANAGER')) {
      return this.staffingService.findGapsForManager(user.userId);
    }
    return { message: 'Admin view not implemented yet' };
  }

  @Get('headcount')
  @Roles('MANAGER', 'HR_ADMIN', 'ADMIN')
  async getHeadcount(@CurrentUser() user: any) {
    if (user.roles.includes('MANAGER')) {
      return this.staffingService.getHeadcountForManager(user.userId);
    }
    return { message: 'Admin view not implemented yet' };
  }
}
