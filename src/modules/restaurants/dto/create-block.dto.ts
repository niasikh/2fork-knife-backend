import { IsString, IsOptional, IsBoolean, IsArray, IsDateString } from 'class-validator';

export class CreateBlockDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  affectedAreas?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  affectedTables?: string[];
}

