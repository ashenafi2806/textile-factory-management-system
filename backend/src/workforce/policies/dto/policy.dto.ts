import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAttendancePolicyDto {
  @ApiProperty({ example: 'Production Standard' })
  name!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional({ example: '08:00' })
  workdayStart?: string;

  @ApiPropertyOptional({ example: '17:00' })
  workdayEnd?: string;

  @ApiPropertyOptional({ example: 5, default: 0 })
  gracePeriodMinutes?: number;

  @ApiPropertyOptional({ example: 10, default: 0 })
  lateThresholdMinutes?: number;

  @ApiPropertyOptional({ example: 10, default: 0 })
  earlyLeaveThresholdMinutes?: number;

  @ApiPropertyOptional({ example: true, default: true })
  overtimeEligible?: boolean;

  @ApiPropertyOptional({ example: 'Production' })
  department?: string;
}
