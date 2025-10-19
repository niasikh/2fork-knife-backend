import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ParseDatePipe } from '../../common/pipes/parse-date.pipe';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('restaurant/:restaurantId')
  async getRestaurantStats(
    @Param('restaurantId') restaurantId: string,
    @Query('startDate', ParseDatePipe) startDate: Date,
    @Query('endDate', ParseDatePipe) endDate: Date,
  ) {
    return this.analyticsService.getRestaurantStats(restaurantId, startDate, endDate);
  }
}
