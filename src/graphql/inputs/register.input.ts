import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class RegisterInput {
  @Field()
  email: string;

  @Field({ nullable: true })
  phone?: string;

  @Field()
  password: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;
}

