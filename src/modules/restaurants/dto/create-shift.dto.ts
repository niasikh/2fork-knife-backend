import { IsString, IsNumber, IsOptional, IsBoolean, Min, Max, Matches } from 'class-validator';

export class CreateShiftDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek: number; // 0=Sunday, 6=Saturday

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:mm format',
  })
  startTime: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:mm format',
  })
  endTime: string;

  @IsOptional()
  @IsNumber()
  @Min(5)
  slotDuration?: number;

  @IsOptional()
  @IsNumber()
  maxCovers?: number;

  @IsOptional()
  @IsNumber()
  maxReservations?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bufferBefore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bufferAfter?: number;

  @IsOptional()
  @IsNumber()
  maxCoversPerSlot?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
