import { ObjectType, Field } from '@nestjs/graphql';
import { UserType } from './user.type';

@ObjectType()
export class AuthPayloadType {
  @Field(() => UserType)
  user: UserType;

  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;
}
