import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'Health check / hello' })
  @ApiResponse({ status: 200, description: 'Returns greeting string' })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
