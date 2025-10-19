import { Resolver, Query, Args } from '@nestjs/graphql';
import { RestaurantsService } from '../../modules/restaurants/restaurants.service';
import { RestaurantType } from '../types/restaurant.type';

@Resolver(() => RestaurantType)
export class RestaurantResolver {
  constructor(private restaurantsService: RestaurantsService) {}

  @Query(() => [RestaurantType], { name: 'restaurants' })
  async getRestaurants(
    @Args('city', { nullable: true }) city?: string,
    @Args('cuisine', { nullable: true }) cuisine?: string,
    @Args('search', { nullable: true }) search?: string,
  ) {
    return this.restaurantsService.findAll({
      city,
      cuisine,
      search,
      isActive: true,
    });
  }

  @Query(() => RestaurantType, { name: 'restaurant' })
  async getRestaurant(@Args('id') id: string) {
    return this.restaurantsService.findOne(id);
  }

  @Query(() => RestaurantType, { name: 'restaurantBySlug' })
  async getRestaurantBySlug(@Args('slug') slug: string) {
    return this.restaurantsService.findBySlug(slug);
  }
}

