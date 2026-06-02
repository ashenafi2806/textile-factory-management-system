import { ApiProperty } from '@nestjs/swagger';

export class CreateTrainingMaterialDto {
  @ApiProperty({ description: 'Title of the training material' })
  title!: string;

  @ApiProperty({ description: 'Description of the training material', required: false })
  description?: string;

  @ApiProperty({ description: 'File URL or path', required: false })
  fileUrl?: string;

  @ApiProperty({ description: 'Category of the training material' })
  category!: string;
}

export class CreateTrainingCourseDto {
  @ApiProperty({ description: 'Title of the course' })
  title!: string;

  @ApiProperty({ description: 'Description of the course', required: false })
  description?: string;

  @ApiProperty({ description: 'Category of the course' })
  category!: string;

  @ApiProperty({ description: 'Is this course required for all workers?', default: false })
  isRequired?: boolean;

  @ApiProperty({ description: 'Order index for sorting', required: false })
  orderIndex?: number;
}

export class CreateTrainingStepDto {
  @ApiProperty({ description: 'Title of the step' })
  title!: string;

  @ApiProperty({ description: 'Description of the step', required: false })
  description?: string;

  @ApiProperty({ description: 'Detailed content/instructions', required: false })
  content?: string;

  @ApiProperty({ description: 'Video URL for this step', required: false })
  videoUrl?: string;

  @ApiProperty({ description: 'Supporting document URL', required: false })
  fileUrl?: string;

  @ApiProperty({ description: 'Does this step require confirmation?', default: false })
  requiresConfirmation?: boolean;
}