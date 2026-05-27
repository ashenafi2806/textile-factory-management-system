<<<<<<< HEAD
=======
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
  Delete,
  UseGuards,
} from '@nestjs/common';
import { WorkersService } from './workers.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller('workforce/workers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkersController {
  constructor(private workersService: WorkersService) {}

  @Post()
  @Roles('HR_ADMIN', 'ADMIN')
  create(@Body() data: any) {
    return this.workersService.createWorker(data);
  }

  @Get()
  @Roles('HR_ADMIN', 'ADMIN', 'SUPERVISOR', 'MANAGER')
  findAll(@CurrentUser() user: any) {
    // For MANAGER role, only return workers in their team
    if (user.roles.includes('MANAGER')) {
      return this.workersService.findByManagerTeam(user.userId);
    }
    return this.workersService.findAll();
  }

  @Get('analytics')
  @Roles('MANAGER', 'HR_ADMIN', 'ADMIN')
  getAnalytics(@CurrentUser() user: any) {
    if (user.roles.includes('MANAGER')) {
      return this.workersService.getWorkforceAnalytics(user.userId);
    }
    return this.workersService.getWorkforceAnalytics();
  }

  @Get(':id')
  @Roles('HR_ADMIN', 'ADMIN', 'SUPERVISOR', 'MANAGER')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    // Ensure manager can only access workers in their team
    if (user.roles.includes('MANAGER')) {
      return this.workersService.findOneInTeam(id, user.userId);
    }
    return this.workersService.findOne(id);
  }

  @Put(':id')
  @Roles('HR_ADMIN', 'ADMIN')
  update(@Param('id') id: string, @Body() data: any) {
    return this.workersService.updateWorker(id, data);
  }

  @Delete(':id')
  @Roles('HR_ADMIN', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.workersService.deleteWorker(id);
  }
}
