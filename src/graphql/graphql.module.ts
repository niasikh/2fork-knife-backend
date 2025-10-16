import { Module } from '@nestjs/common';
import { RestaurantsModule } from '../modules/restaurants/restaurants.module';
import { ReservationsModule } from '../modules/reservations/reservations.module';
import { AuthModule } from '../modules/auth/auth.module';
import { AvailabilityModule } from '../modules/availability/availability.module';

// Resolvers
import { RestaurantResolver } from './resolvers/restaurant.resolver';
import { ReservationResolver } from './resolvers/reservation.resolver';
import { AuthResolver } from './resolvers/auth.resolver';
import { AvailabilityResolver } from './resolvers/availability.resolver';

@Module({
  imports: [RestaurantsModule, ReservationsModule, AuthModule, AvailabilityModule],
  providers: [
    RestaurantResolver,
    ReservationResolver,
    AuthResolver,
    AvailabilityResolver,
  ],
})
export class GraphqlModule {}

