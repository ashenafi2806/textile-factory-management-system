import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { DisciplinaryStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { DisciplineService } from './discipline.service';
import {
  CreateDisciplinaryActionDto,
  UpdateDisciplinaryActionDto,
} from './dto/discipline.dto';

@ApiTags('workforce/discipline')
@ApiBearerAuth('jwt')
@Controller('workforce/discipline')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DisciplineController {
  constructor(private readonly disciplineService: DisciplineService) {}

  @ApiOperation({ summary: 'List disciplinary actions' })
  @ApiQuery({ name: 'status', required: false, enum: DisciplinaryStatus })
  @ApiQuery({ name: 'workerId', required: false })
  @ApiResponse({ status: 200, description: 'Array of disciplinary actions' })
  @Get()
  @Roles('SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'ADMIN')
  list(
    @Query('status') status?: DisciplinaryStatus,
    @Query('workerId') workerId?: string,
  ) {
    return this.disciplineService.list({ status, workerId });
  }

  @ApiOperation({ summary: 'Get a disciplinary action by ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Disciplinary action' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  @Roles('SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'ADMIN', 'WORKER')
  async getOne(@Param('id') id: string, @CurrentUser() user: any) {
    const action = await this.disciplineService.getOne(id);
    if (
      user.roles.includes('WORKER') &&
      !user.roles.includes('SUPERVISOR') &&
      !user.roles.includes('ADMIN') &&
      !user.roles.includes('HR_ADMIN') &&
      !user.roles.includes('MANAGER')
    ) {
      if (action.workerId !== user.workerProfileId) {
        const { NotFoundException } = await import('@nestjs/common');
        throw new NotFoundException('Not found');
      }
    }
    return action;
  }

  @ApiOperation({ summary: 'Issue a new disciplinary action' })
  @ApiBody({ type: CreateDisciplinaryActionDto })
  @ApiResponse({ status: 201, description: 'Disciplinary action created' })
  @Post()
  @Roles('SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'ADMIN')
  create(
    @Body() dto: CreateDisciplinaryActionDto,
    @CurrentUser() user: any,
  ) {
    return this.disciplineService.create({
      ...dto,
      issuedById: user.userId ?? user.id,
    });
  }

  @ApiOperation({ summary: 'Update a disciplinary action' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateDisciplinaryActionDto })
  @ApiResponse({ status: 200, description: 'Updated' })
  @Patch(':id')
  @Roles('SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateDisciplinaryActionDto) {
    return this.disciplineService.update(id, dto);
  }

  @ApiOperation({ summary: 'Acknowledge a disciplinary action (worker)' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Acknowledged' })
  @Put(':id/acknowledge')
  @Roles('WORKER', 'SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'ADMIN')
  acknowledge(@Param('id') id: string, @CurrentUser() user: any) {
    return this.disciplineService.acknowledge(id, user.userId ?? user.id);
  }

  @ApiOperation({ summary: 'Revoke a disciplinary action' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Revoked' })
  @Put(':id/revoke')
  @Roles('MANAGER', 'HR_ADMIN', 'ADMIN', 'SUPERVISOR')
  revoke(@Param('id') id: string) {
    return this.disciplineService.revoke(id);
  }
}
