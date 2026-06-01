import { ApiProperty } from '@nestjs/swagger';

export class QaReviewDto {
  @ApiProperty({ enum: ['APPROVE', 'REJECT'] })
  action!: 'APPROVE' | 'REJECT';
}
