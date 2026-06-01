import { IsString, IsNotEmpty, IsOptional, IsISO8601 } from 'class-validator';

export class AssignShiftDto {
  @IsString()
  @IsNotEmpty()
  workerId: string;

  @IsString()
  @IsNotEmpty()
  shiftId: string;

  @IsISO8601()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsOptional()
  createdById?: string;
}
