import {
  IsString,
  IsNumber,
  IsDateString,
  IsEmail,
  IsOptional,
  Min,
  Matches,
} from 'class-validator';

export class CreateReservationDto {
  @IsString()
  restaurantId: string;

  @IsDateString()
  reservationDate: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Time must be in HH:mm format',
  })
  startTime: string;

  @IsNumber()
  @Min(1)
  partySize: number;

  @IsString()
  guestName: string;

  @IsEmail()
  guestEmail: string;

  @IsString()
  guestPhone: string;

  @IsOptional()
  @IsString()
  occasion?: string;

  @IsOptional()
  @IsString()
  specialRequests?: string;

  @IsOptional()
  @IsString()
  dietaryNotes?: string;

  @IsOptional()
  @IsString()
  seatingPreference?: string;

  @IsOptional()
  @IsString()
  experienceId?: string;
}

