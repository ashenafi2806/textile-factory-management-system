import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Query,
  Put,
} from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller('workforce/incidents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  @Roles('SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'ADMIN')
  getAll(@Query() query: any) {
    const filters: any = {};
    if (query.status) filters.status = query.status;
    if (query.severity) filters.severity = query.severity;
    return this.incidentsService.getAll(filters);
  }

  @Get(':id')
  @Roles('SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'ADMIN')
  getOne(@Param('id') id: string) {
    return this.incidentsService.getOne(id);
  }

  @Post()
  @Roles('SUPERVISOR', 'ADMIN')
  create(@CurrentUser() user: any, @Body() payload: any) {
    return this.incidentsService.create({
      ...payload,
      reportedBy: user.userId,
    });
  }

  @Put(':id/approve')
  @Roles('MANAGER', 'HR_ADMIN', 'ADMIN')
  approve(@CurrentUser() user: any, @Param('id') id: string) {
    return this.incidentsService.approve(id, user.userId);
  }
}
