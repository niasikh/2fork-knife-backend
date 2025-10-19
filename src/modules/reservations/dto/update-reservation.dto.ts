import { PartialType } from '@nestjs/mapped-types';
import { CreateReservationDto } from './create-reservation.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReservationStatus } from '@prisma/client';

export class UpdateReservationDto extends PartialType(CreateReservationDto) {
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @IsOptional()
  @IsString()
  tableId?: string;

  @IsOptional()
  @IsString()
  internalNotes?: string;
}
