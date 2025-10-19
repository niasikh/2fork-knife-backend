import { IsNumber, IsOptional, IsBoolean, IsString, Min, Matches } from 'class-validator';

export class UpdatePolicyDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  minAdvanceMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxAdvanceDays?: number;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  sameDayBookingCutoff?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  freeCancelMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cancellationFeeAmount?: number;

  @IsOptional()
  @IsBoolean()
  cancellationFeeEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  noShowFeeAmount?: number;

  @IsOptional()
  @IsBoolean()
  noShowFeeEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  noShowGraceMinutes?: number;

  @IsOptional()
  @IsBoolean()
  requireDeposit?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  depositAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  depositThreshold?: number;

  @IsOptional()
  @IsBoolean()
  allowModifications?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  modificationCutoff?: number;

  @IsOptional()
  @IsBoolean()
  autoConfirm?: boolean;
}
