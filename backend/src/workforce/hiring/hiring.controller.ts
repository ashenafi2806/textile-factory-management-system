import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { HiringService } from './hiring.service';
import { CreateHiringRequestDto } from './dto/create-hiring-request.dto';

@Controller('workforce/hiring')
export class HiringController {
  constructor(private readonly hiringService: HiringService) {}

  @Get('requests')
  getRequests(@Query('status') status?: string) {
    return this.hiringService.getAll(status as any);
  }

  @Get('requests/:id')
  getOne(@Param('id') id: string) {
    return this.hiringService.getById(id);
  }

  @Post('requisition')
  create(@Body() payload: CreateHiringRequestDto) {
    return this.hiringService.create(payload as any);
  }

  @Put(':id/approve')
  approve(@Param('id') id: string) {
    return this.hiringService.approve(id);
  }

  @Put(':id/reject')
  reject(@Param('id') id: string) {
    return this.hiringService.reject(id);
  }
}

// default export removed to keep named exports consistent
