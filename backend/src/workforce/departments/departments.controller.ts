import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('workforce/departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentsController {
  constructor(private departmentsService: DepartmentsService) {}

  @Post()
  @Roles('HR_ADMIN', 'ADMIN')
  create(@Body() data: { name: string; description?: string }) {
    return this.departmentsService.createDepartment(data);
  }

  @Get()
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER')
  findAll() {
    return this.departmentsService.findAll();
  }

  @Get(':id')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER')
  findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @Post(':id/teams')
  @Roles('HR_ADMIN', 'ADMIN')
  createTeam(@Param('id') departmentId: string, @Body() data: { name: string }) {
    return this.departmentsService.createTeam(departmentId, data);
  }

  @Put(':id')
  @Roles('HR_ADMIN', 'ADMIN')
  update(@Param('id') id: string, @Body() data: { name?: string; description?: string }) {
    return this.departmentsService.updateDepartment(id, data);
  }

  @Delete(':id')
  @Roles('HR_ADMIN', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.departmentsService.deleteDepartment(id);
  }
}
