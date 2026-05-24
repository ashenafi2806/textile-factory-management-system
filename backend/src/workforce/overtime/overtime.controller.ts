import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { OvertimeService } from './overtime.service';

@Controller('workforce/overtime')
export class OvertimeController {
  constructor(private readonly overtimeService: OvertimeService) {}

  @Get('pending')
  getPending() {
    return this.overtimeService.getPending();
  }

  @Post()
  create(@Body() payload: any) {
    return this.overtimeService.create(payload);
  }

  @Put(':id/approve')
  approve(@Param('id') id: string) {
    return this.overtimeService.approve(id);
  }
}

// default export removed to keep named exports consistent
