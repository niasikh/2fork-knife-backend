import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class AvailabilityType {
  @Field()
  available: boolean;

  @Field({ nullable: true })
  reason?: string;
}

@ObjectType()
export class TimeSlotType {
  @Field()
  time: string;

  @Field()
  available: boolean;

  @Field({ nullable: true })
  shift?: string;
}
