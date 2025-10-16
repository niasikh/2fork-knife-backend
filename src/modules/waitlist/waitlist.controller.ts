import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { WaitlistService } from './waitlist.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ParseDatePipe } from '../../common/pipes/parse-date.pipe';

@Controller('waitlist')
@UseGuards(JwtAuthGuard)
export class WaitlistController {
  constructor(private waitlistService: WaitlistService) {}

  @Get()
  async findAll(
    @Query('restaurantId') restaurantId: string,
    @Query('date', ParseDatePipe) date: Date,
  ) {
    return this.waitlistService.findAll(restaurantId, date);
  }
}

