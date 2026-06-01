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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { IncidentsService } from './incidents.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CreateIncidentDto } from './dto/incident.dto';

@ApiTags('workforce/incidents')
@ApiBearerAuth('jwt')
@Controller('workforce/incidents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @ApiOperation({ summary: 'List incidents, optionally filtered by status/severity' })
  @ApiQuery({ name: 'status', required: false, example: 'OPEN' })
  @ApiQuery({ name: 'severity', required: false, example: 'HIGH' })
  @ApiResponse({ status: 200, description: 'Array of incidents' })
  @Get()
  @Roles('SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'ADMIN')
  getAll(@Query() query: any) {
    const filters: any = {};
    if (query.status) filters.status = query.status;
    if (query.severity) filters.severity = query.severity;
    return this.incidentsService.getAll(filters);
  }

  @ApiOperation({ summary: 'Get an incident by ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Incident' })
  @Get(':id')
  @Roles('SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'ADMIN')
  getOne(@Param('id') id: string) {
    return this.incidentsService.getOne(id);
  }

  @ApiOperation({ summary: 'Report a new incident' })
  @ApiBody({ type: CreateIncidentDto })
  @ApiResponse({ status: 201, description: 'Incident created' })
  @Post()
  @Roles('SUPERVISOR', 'ADMIN')
  create(@CurrentUser() user: any, @Body() payload: CreateIncidentDto) {
    return this.incidentsService.create({
      ...payload,
      reportedBy: user.userId,
    });
  }

  @ApiOperation({ summary: 'Approve an incident report' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Approved' })
  @Put(':id/approve')
  @Roles('MANAGER', 'HR_ADMIN', 'ADMIN', 'SUPERVISOR')
  approve(@CurrentUser() user: any, @Param('id') id: string) {
    return this.incidentsService.approve(id, user.userId);
  }
}
