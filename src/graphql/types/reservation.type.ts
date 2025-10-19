import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { RestaurantType } from './restaurant.type';

@ObjectType()
export class ReservationType {
  @Field(() => ID)
  id: string;

  @Field()
  confirmationCode: string;

  @Field()
  restaurantId: string;

  @Field(() => RestaurantType, { nullable: true })
  restaurant?: RestaurantType;

  @Field()
  reservationDate: Date;

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

  @Field()
  status: string;

  @Field()
  source: string;

  @Field({ nullable: true })
  confirmedAt?: Date;

  @Field({ nullable: true })
  seatedAt?: Date;

  @Field({ nullable: true })
  completedAt?: Date;

  @Field({ nullable: true })
  cancelledAt?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
