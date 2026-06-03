import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
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

  @ApiOperation({ summary: 'Staffing dashboard (department or organization-wide)' })
  @ApiQuery({ name: 'department', required: false })
  @ApiResponse({ status: 200, description: 'Dashboard data' })
  @Get('dashboard')
  @Roles('MANAGER', 'HR_ADMIN', 'ADMIN')
  getStaffingDashboard(
    @CurrentUser() user: any,
    @Query('department') department?: string,
  ) {
    return this.staffingService.getDashboard(
      user.userId ?? user.id,
      user.roles ?? [],
      department,
    );
  }

  @ApiOperation({ summary: 'Identify staffing gaps' })
  @ApiQuery({ name: 'department', required: false })
  @ApiResponse({ status: 200, description: 'Array of gaps' })
  @Get('gaps')
  @Roles('MANAGER', 'HR_ADMIN', 'ADMIN')
  identifyGaps(
    @CurrentUser() user: any,
    @Query('department') department?: string,
  ) {
    return this.staffingService.findGaps(
      user.userId ?? user.id,
      user.roles ?? [],
      department,
    );
  }

  @ApiOperation({ summary: 'Headcount summary' })
  @ApiQuery({ name: 'department', required: false })
  @ApiResponse({ status: 200, description: 'Headcount data' })
  @Get('headcount')
  @Roles('MANAGER', 'HR_ADMIN', 'ADMIN')
  getHeadcount(
    @CurrentUser() user: any,
    @Query('department') department?: string,
  ) {
    return this.staffingService.getHeadcount(
      user.userId ?? user.id,
      user.roles ?? [],
      department,
    );
  }
}
