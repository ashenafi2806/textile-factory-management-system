import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { HiringService } from './hiring.service';

@Controller('workforce/hiring')
export class HiringController {
  constructor(private readonly hiringService: HiringService) {}

  @Get('requests')
  getRequests() {
    return this.hiringService.getAll();
  }

  @Post('requisition')
  create(@Body() payload: any) {
    return this.hiringService.create(payload);
  }

  @Put(':id/approve')
  approve(@Param('id') id: string) {
    return this.hiringService.approve(id);
  }
}

// default export removed to keep named exports consistent
