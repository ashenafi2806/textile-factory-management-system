import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateHiringRequestDto {
  @IsString()
  @MaxLength(100)
  role!: string;

  @IsInt()
  @Min(1)
  headcount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @IsOptional()
  @IsString()
  requiredBy?: string; // ISO date string, optional

  @IsOptional()
  @IsString()
  @MaxLength(100)
  createdBy?: string;
}
