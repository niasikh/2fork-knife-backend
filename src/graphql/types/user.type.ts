import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class UserType {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  phone?: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  role: string;

  @Field()
  isActive: boolean;

  @Field()
  emailVerified: boolean;

  @Field()
  phoneVerified: boolean;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  lastLoginAt?: Date;
}
