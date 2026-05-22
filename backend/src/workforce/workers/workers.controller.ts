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
import { WorkersService } from './workers.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('workforce/workers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkersController {
  constructor(private workersService: WorkersService) {}

  @Post()
  @Roles('HR_ADMIN', 'ADMIN')
  create(@Body() data: any) {
    return this.workersService.createWorker(data);
  }

  @Get()
  @Roles('HR_ADMIN', 'ADMIN', 'SUPERVISOR', 'MANAGER')
  findAll() {
    return this.workersService.findAll();
  }

  @Get(':id')
  @Roles('HR_ADMIN', 'ADMIN', 'SUPERVISOR', 'MANAGER')
  findOne(@Param('id') id: string) {
    return this.workersService.findOne(id);
  }

  @Put(':id')
  @Roles('HR_ADMIN', 'ADMIN')
  update(@Param('id') id: string, @Body() data: any) {
    return this.workersService.updateWorker(id, data);
  }

  @Delete(':id')
  @Roles('HR_ADMIN', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.workersService.deleteWorker(id);
  }
}
