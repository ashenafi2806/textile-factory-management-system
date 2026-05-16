import { ProductionIssuePriority, ProductionIssueType } from '@prisma/client';

export class ReportIssueDto {
  stageId?: string;
  issueType: ProductionIssueType;
  description: string;
  priority?: ProductionIssuePriority;
}
