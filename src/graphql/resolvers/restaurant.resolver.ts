import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RestaurantsService } from '../../modules/restaurants/restaurants.service';
import { RestaurantType } from '../types/restaurant.type';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

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

