import { Controller, Get, Query, Param } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { Public } from '../../common/decorators/public.decorator';
import { ParseDatePipe } from '../../common/pipes/parse-date.pipe';

@Controller('availability')
export class AvailabilityController {
  constructor(private availabilityService: AvailabilityService) {}

  @Public()
  @Get(':restaurantId/check')
  async checkAvailability(
    @Param('restaurantId') restaurantId: string,
    @Query('date', ParseDatePipe) date: Date,
    @Query('time') time: string,
    @Query('partySize') partySize: string,
  ) {
    return this.availabilityService.checkAvailability(
      restaurantId,
      date,
      time,
      parseInt(partySize),
    );
  }

  @Public()
  @Get(':restaurantId/slots')
  async getAvailableSlots(
    @Param('restaurantId') restaurantId: string,
    @Query('date', ParseDatePipe) date: Date,
    @Query('partySize') partySize: string,
  ) {
    return this.availabilityService.getAvailableSlots(restaurantId, date, parseInt(partySize));
  }
}

