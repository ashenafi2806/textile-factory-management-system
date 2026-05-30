/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { OvertimeService } from './overtime.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller('workforce/overtime')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OvertimeController {
  constructor(private readonly overtimeService: OvertimeService) {}

  @Get('pending')
  @Roles('MANAGER', 'HR_ADMIN', 'ADMIN')
  getPending() {
    return this.overtimeService.getPending();
  }

  @Post()
  @Roles('WORKER', 'SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'ADMIN')
  create(@Body() payload: any, @CurrentUser() user: any) {
    const createdById = user?.userId ?? user?.id ?? undefined;
    return this.overtimeService.create({ ...payload, createdById });
  }

  @Put(':id/approve')
  @Roles('MANAGER', 'HR_ADMIN', 'ADMIN')
  approve(@Param('id') id: string, @CurrentUser() user: any) {
    const approverId = user?.userId ?? user?.id ?? undefined;
    return this.overtimeService.approve(id, approverId);
  }

  @Put(':id/reject')
  @Roles('MANAGER', 'HR_ADMIN', 'ADMIN')
  reject(@Param('id') id: string, @CurrentUser() user: any) {
    const approverId = user?.userId ?? user?.id ?? undefined;
    return this.overtimeService.reject(id, approverId);
  }
}

// default export removed to keep named exports consistent
