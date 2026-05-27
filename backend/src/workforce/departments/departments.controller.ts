<<<<<<< HEAD
=======
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
>>>>>>> main
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
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller('workforce/departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentsController {
  constructor(private departmentsService: DepartmentsService) {}

  @Post()
  @Roles('HR_ADMIN', 'ADMIN')
  create(
    @Body() data: { name: string; description?: string; managerId?: string },
  ) {
    return this.departmentsService.createDepartment(data);
  }

  @Get()
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER')
  findAll(@CurrentUser() user: any) {
    if (user.roles.includes('MANAGER')) {
      return this.departmentsService.findDepartmentsForManager(user.userId);
    }
    return this.departmentsService.findAll();
  }

  @Get(':id')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER')
  findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @Get(':id/analytics')
  @Roles('MANAGER', 'HR_ADMIN', 'ADMIN')
  getAnalytics(@Param('id') id: string) {
    return this.departmentsService.getDepartmentAnalytics(id);
  }

  @Post(':id/teams')
  @Roles('HR_ADMIN', 'ADMIN')
  createTeam(
    @Param('id') departmentId: string,
<<<<<<< HEAD
    @Body() data: { name: string },
=======
    @Body() data: { name: string; supervisorId?: string },
>>>>>>> main
  ) {
    return this.departmentsService.createTeam(departmentId, data);
  }

  @Put(':id')
  @Roles('HR_ADMIN', 'ADMIN')
  update(
    @Param('id') id: string,
<<<<<<< HEAD
    @Body() data: { name?: string; description?: string },
=======
    @Body() data: { name?: string; description?: string; managerId?: string },
>>>>>>> main
  ) {
    return this.departmentsService.updateDepartment(id, data);
  }

  @Delete(':id')
  @Roles('HR_ADMIN', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.departmentsService.deleteDepartment(id);
  }
}
