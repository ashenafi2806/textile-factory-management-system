import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductionIssuePriority, ProductionIssueType } from '@prisma/client';

export class ReportIssueDto {
  @ApiPropertyOptional()
  stageId?: string;

  @ApiProperty({ enum: ProductionIssueType })
  issueType!: ProductionIssueType;

  @ApiProperty()
  description!: string;

  @ApiPropertyOptional({ enum: ProductionIssuePriority })
  priority?: ProductionIssuePriority;
}
