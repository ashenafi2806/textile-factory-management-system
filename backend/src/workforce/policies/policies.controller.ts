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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { PoliciesService } from './policies.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CreateAttendancePolicyDto } from './dto/policy.dto';

@ApiTags('workforce/policies')
@ApiBearerAuth('jwt')
@Controller('workforce/policies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PoliciesController {
  constructor(private policiesService: PoliciesService) {}

  @ApiOperation({ summary: 'Create an attendance policy' })
  @ApiBody({ type: CreateAttendancePolicyDto })
  @ApiResponse({ status: 201, description: 'Created' })
  @Post()
  @Roles('HR_ADMIN', 'ADMIN')
  create(@CurrentUser() user: any, @Body() body: CreateAttendancePolicyDto) {
    const createdById = user?.userId ?? user?.id ?? null;
    return this.policiesService.create({ ...body, createdById });
  }

  @ApiOperation({ summary: 'List attendance policies' })
  @ApiResponse({ status: 200, description: 'Array of policies' })
  @Get()
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER')
  findAll() {
    return this.policiesService.findAll();
  }

  @ApiOperation({ summary: 'Get a policy by ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Policy' })
  @Get(':id')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER')
  findOne(@Param('id') id: string) {
    return this.policiesService.findOne(id);
  }

  @ApiOperation({ summary: 'Update a policy' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: CreateAttendancePolicyDto })
  @ApiResponse({ status: 200, description: 'Updated' })
  @Put(':id')
  @Roles('HR_ADMIN', 'ADMIN')
  update(@Param('id') id: string, @Body() body: Partial<CreateAttendancePolicyDto>) {
    return this.policiesService.update(id, body);
  }

  @ApiOperation({ summary: 'Delete a policy' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Deleted' })
  @Delete(':id')
  @Roles('HR_ADMIN', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.policiesService.remove(id);
  }
}

export default PoliciesController;
