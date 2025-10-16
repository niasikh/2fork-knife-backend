import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class RestaurantType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  address: string;

  @Field()
  city: string;

  @Field({ nullable: true })
  district?: string;

  @Field(() => Float, { nullable: true })
  latitude?: number;

  @Field(() => Float, { nullable: true })
  longitude?: number;

  @Field()
  phone: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  website?: string;

  @Field(() => [String])
  cuisine: string[];

  @Field(() => Int)
  priceRange: number;

  @Field(() => Int, { nullable: true })
  capacity?: number;

  @Field(() => [String])
  imageUrls: string[];

  @Field({ nullable: true })
  coverImage?: string;

  @Field({ nullable: true })
  logoUrl?: string;

  @Field(() => Float, { nullable: true })
  rating?: number;

  @Field(() => Int)
  reviewCount: number;

  @Field()
  isActive: boolean;

  @Field()
  isVerified: boolean;

  @Field()
  createdAt: Date;
}

