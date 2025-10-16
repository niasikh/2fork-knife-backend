import { InputType, Field, Int } from '@nestjs/graphql';

@InputType()
export class CreateReservationInput {
  @Field()
  restaurantId: string;

  @Field()
  reservationDate: string;

  @Field()
  startTime: string;

  @Field(() => Int)
  partySize: number;

  @Field()
  guestName: string;

  @Field()
  guestEmail: string;

  @Field()
  guestPhone: string;

  @Field({ nullable: true })
  occasion?: string;

  @Field({ nullable: true })
  specialRequests?: string;

  @Field({ nullable: true })
  dietaryNotes?: string;

  @Field({ nullable: true })
  seatingPreference?: string;

  @Field({ nullable: true })
  experienceId?: string;
}

