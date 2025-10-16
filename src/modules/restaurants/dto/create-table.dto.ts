import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class CreateTableDto {
  @IsString()
  areaId: string;

  @IsString()
  number: string;

  @IsNumber()
  @Min(1)
  minSeats: number;

  @IsNumber()
  @Min(1)
  maxSeats: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  posTableId?: string;
}

