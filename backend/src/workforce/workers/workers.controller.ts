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
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { WorkersService } from './workers.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import {
  CreateWorkerDto,
  UpdateWorkerDto,
} from './dto/workers.dto';
import { isManagerScopedUser } from '../../auth/utils/role.utils';

@ApiTags('workforce/workers')
@ApiBearerAuth('jwt')
@Controller('workforce/workers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkersController {
  constructor(private workersService: WorkersService) {}

  @ApiOperation({ summary: 'Create a worker (with linked user account)' })
  @ApiBody({ type: CreateWorkerDto })
  @ApiResponse({ status: 201, description: 'Worker created' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @Post()
  @Roles('HR_ADMIN', 'ADMIN')
  create(@Body() data: CreateWorkerDto) {
    return this.workersService.createWorker(data);
  }

  @ApiOperation({
    summary: 'List workers (managers see only their department)',
  })
  @ApiResponse({ status: 200, description: 'Array of workers' })
  @Get()
  @Roles('HR_ADMIN', 'ADMIN', 'SUPERVISOR', 'MANAGER')
  findAll(@CurrentUser() user: any) {
    if (isManagerScopedUser(user)) {
      return this.workersService.findByManagerTeam(user.userId);
    }
    return this.workersService.findAll();
  }

  @ApiOperation({ summary: 'Workforce analytics (counts, attendance today)' })
  @ApiResponse({ status: 200, description: 'Analytics payload' })
  @Get('analytics')
  @Roles('MANAGER', 'HR_ADMIN', 'ADMIN')
  getAnalytics(@CurrentUser() user: any) {
    if (isManagerScopedUser(user)) {
      return this.workersService.getWorkforceAnalytics(user.userId);
    }
    return this.workersService.getWorkforceAnalytics();
  }

  @ApiOperation({ summary: 'Get a worker by ID' })
  @ApiParam({ name: 'id', description: 'Worker profile UUID' })
  @ApiResponse({ status: 200, description: 'Worker record' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  @Roles('HR_ADMIN', 'ADMIN', 'SUPERVISOR', 'MANAGER')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    if (isManagerScopedUser(user)) {
      return this.workersService.findOneInTeam(id, user.userId);
    }
    return this.workersService.findOne(id);
  }

  @ApiOperation({ summary: 'Update a worker' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateWorkerDto })
  @ApiResponse({ status: 200, description: 'Updated' })
  @Put(':id')
  @Roles('HR_ADMIN', 'ADMIN')
  update(@Param('id') id: string, @Body() data: UpdateWorkerDto) {
    return this.workersService.updateWorker(id, data);
  }

  @ApiOperation({ summary: 'Delete a worker (and their user account)' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Deleted' })
  @Delete(':id')
  @Roles('HR_ADMIN', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.workersService.deleteWorker(id);
  }
}
