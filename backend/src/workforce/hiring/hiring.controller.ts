import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
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
import { HiringService } from './hiring.service';
import { CreateHiringRequestDto } from './dto/create-hiring-request.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@ApiTags('workforce/hiring')
@ApiBearerAuth('jwt')
@Controller('workforce/hiring')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HiringController {
  constructor(private readonly hiringService: HiringService) {}

  @ApiOperation({ summary: 'List hiring requests, optionally filtered by status' })
  @ApiQuery({ name: 'status', required: false, example: 'PENDING' })
  @ApiResponse({ status: 200, description: 'Array of hiring requests' })
  @Get('requests')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER')
  getRequests(@Query('status') status?: string) {
    return this.hiringService.getAll(status as any);
  }

  @ApiOperation({ summary: 'Get a hiring request by ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Request' })
  @Get('requests/:id')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER')
  getOne(@Param('id') id: string) {
    return this.hiringService.getById(id);
  }

  @ApiOperation({ summary: 'Create a hiring requisition' })
  @ApiBody({ type: CreateHiringRequestDto })
  @ApiResponse({ status: 201, description: 'Requisition created' })
  @Post('requisition')
  @Roles('MANAGER', 'HR_ADMIN', 'ADMIN')
  create(@Body() payload: CreateHiringRequestDto, @CurrentUser() user: any) {
    const requestedById = user?.userId ?? user?.id ?? undefined;
    return this.hiringService.create({ ...payload, requestedById });
  }

  @ApiOperation({ summary: 'Approve a hiring requisition' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Approved' })
  @Put(':id/approve')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER')
  approve(@Param('id') id: string, @CurrentUser() user: any) {
    const approverId = user?.userId ?? user?.id ?? undefined;
    return this.hiringService.approve(id, approverId);
  }

  @ApiOperation({ summary: 'Reject a hiring requisition' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Rejected' })
  @Put(':id/reject')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER')
  reject(@Param('id') id: string, @CurrentUser() user: any) {
    const approverId = user?.userId ?? user?.id ?? undefined;
    return this.hiringService.reject(id, approverId);
  }
}
