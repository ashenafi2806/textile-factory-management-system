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
import { HiringService } from './hiring.service';
import { CreateHiringRequestDto } from './dto/create-hiring-request.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller('workforce/hiring')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HiringController {
  constructor(private readonly hiringService: HiringService) {}

  @Get('requests')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER')
  getRequests(@Query('status') status?: string) {
    return this.hiringService.getAll(status as any);
  }

  @Get('requests/:id')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER')
  getOne(@Param('id') id: string) {
    return this.hiringService.getById(id);
  }

  @Post('requisition')
  @Roles('MANAGER', 'HR_ADMIN', 'ADMIN')
  create(@Body() payload: CreateHiringRequestDto, @CurrentUser() user: any) {
    const requestedById = user?.userId ?? user?.id ?? undefined;
    return this.hiringService.create({ ...payload, requestedById });
  }

  @Put(':id/approve')
  @Roles('HR_ADMIN', 'ADMIN')
  approve(@Param('id') id: string, @CurrentUser() user: any) {
    const approverId = user?.userId ?? user?.id ?? undefined;
    return this.hiringService.approve(id, approverId);
  }

  @Put(':id/reject')
  @Roles('HR_ADMIN', 'ADMIN')
  reject(@Param('id') id: string, @CurrentUser() user: any) {
    const approverId = user?.userId ?? user?.id ?? undefined;
    return this.hiringService.reject(id, approverId);
  }
}

// default export removed to keep named exports consistent
