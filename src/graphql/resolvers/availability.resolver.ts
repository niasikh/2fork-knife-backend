import { Resolver, Query, Args } from '@nestjs/graphql';
import { AvailabilityService } from '../../modules/availability/availability.service';
import { AvailabilityType, TimeSlotType } from '../types/availability.type';

@Resolver()
export class AvailabilityResolver {
  constructor(private availabilityService: AvailabilityService) {}

  @Query(() => AvailabilityType, { name: 'checkAvailability' })
  async checkAvailability(
    @Args('restaurantId') restaurantId: string,
    @Args('date') date: string,
    @Args('time') time: string,
    @Args('partySize') partySize: number,
  ) {
    return this.availabilityService.checkAvailability(
      restaurantId,
      new Date(date),
      time,
      partySize,
    );
  }

  @Query(() => [TimeSlotType], { name: 'availableSlots' })
  async availableSlots(
    @Args('restaurantId') restaurantId: string,
    @Args('date') date: string,
    @Args('partySize') partySize: number,
  ) {
    return this.availabilityService.getAvailableSlots(
      restaurantId,
      new Date(date),
      partySize,
    );
  }
}

