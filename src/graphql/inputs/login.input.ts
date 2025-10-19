import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class LoginInput {
  @Field()
  identifier: string;

  @Field()
  password: string;
}
