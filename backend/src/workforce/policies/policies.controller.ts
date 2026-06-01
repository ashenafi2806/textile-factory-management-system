/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
import { PoliciesService } from './policies.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller('workforce/policies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PoliciesController {
  constructor(private policiesService: PoliciesService) {}

  @Post()
  @Roles('HR_ADMIN', 'ADMIN')
  create(@CurrentUser() user: any, @Body() body: any) {
    const createdById = user?.userId ?? user?.id ?? null;
    return this.policiesService.create({ ...body, createdById });
  }

  @Get()
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER')
  findAll() {
    return this.policiesService.findAll();
  }

  @Get(':id')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER')
  findOne(@Param('id') id: string) {
    return this.policiesService.findOne(id);
  }

  @Put(':id')
  @Roles('HR_ADMIN', 'ADMIN')
  update(@Param('id') id: string, @Body() body: any) {
    return this.policiesService.update(id, body);
  }

  @Delete(':id')
  @Roles('HR_ADMIN', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.policiesService.remove(id);
  }
}

export default PoliciesController;
