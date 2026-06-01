import { ApiProperty } from '@nestjs/swagger';

export class RequestLeaveDto {
  @ApiProperty({ example: '2026-06-10', description: 'YYYY-MM-DD' })
  startDate!: string;

  @ApiProperty({ example: '2026-06-12', description: 'YYYY-MM-DD' })
  endDate!: string;

  @ApiProperty({ example: 'Family event' })
  reason!: string;
}

export class ApproveLeaveDto {
  @ApiProperty({
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    example: 'APPROVED',
  })
  status!: 'PENDING' | 'APPROVED' | 'REJECTED';
}
