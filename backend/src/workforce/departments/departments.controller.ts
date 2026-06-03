import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';

@ApiTags('workforce/departments')
@ApiBearerAuth('jwt')
@Controller('workforce/departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @ApiOperation({ summary: 'List all departments with worker counts' })
  @ApiResponse({ status: 200, description: 'Department list' })
  @Get()
  @Roles('HR_ADMIN', 'ADMIN', 'SUPERVISOR', 'MANAGER')
  findAll() {
    return this.departmentsService.findAll();
  }

  @ApiOperation({ summary: 'Create a department' })
  @ApiBody({ type: CreateDepartmentDto })
  @ApiResponse({ status: 201, description: 'Department created' })
  @Post()
  @Roles('HR_ADMIN', 'ADMIN')
  create(@Body() dto: CreateDepartmentDto) {
    return this.departmentsService.create(dto);
  }

  @ApiOperation({ summary: 'Delete a department (only if no workers assigned)' })
  @ApiParam({ name: 'id' })
  @Delete(':id')
  @Roles('HR_ADMIN', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }
}
