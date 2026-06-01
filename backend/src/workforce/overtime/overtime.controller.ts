/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { OvertimeService } from './overtime.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CreateOvertimeDto } from './dto/overtime.dto';

@ApiTags('workforce/overtime')
@ApiBearerAuth('jwt')
@Controller('workforce/overtime')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OvertimeController {
  constructor(private readonly overtimeService: OvertimeService) {}

  @ApiOperation({ summary: 'List pending overtime requests' })
  @ApiResponse({ status: 200, description: 'Array of pending requests' })
  @Get('pending')
  @Roles('MANAGER', 'HR_ADMIN', 'ADMIN')
  getPending() {
    return this.overtimeService.getPending();
  }

  @ApiOperation({ summary: 'Create an overtime request' })
  @ApiBody({ type: CreateOvertimeDto })
  @ApiResponse({ status: 201, description: 'Created' })
  @Post()
  @Roles('WORKER', 'SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'ADMIN')
  create(@Body() payload: CreateOvertimeDto, @CurrentUser() user: any) {
    const createdById = user?.userId ?? user?.id ?? undefined;
    return this.overtimeService.create({ ...payload, createdById });
  }

  @ApiOperation({ summary: 'Approve an overtime request' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Approved' })
  @Put(':id/approve')
  @Roles('MANAGER', 'HR_ADMIN', 'ADMIN')
  approve(@Param('id') id: string, @CurrentUser() user: any) {
    const approverId = user?.userId ?? user?.id ?? undefined;
    return this.overtimeService.approve(id, approverId);
  }

  @ApiOperation({ summary: 'Reject an overtime request' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Rejected' })
  @Put(':id/reject')
  @Roles('MANAGER', 'HR_ADMIN', 'ADMIN')
  reject(@Param('id') id: string, @CurrentUser() user: any) {
    const approverId = user?.userId ?? user?.id ?? undefined;
    return this.overtimeService.reject(id, approverId);
  }
}
