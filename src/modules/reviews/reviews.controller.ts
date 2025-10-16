import { Controller, Get, Param } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Public()
  @Get('restaurant/:restaurantId')
  async findAll(@Param('restaurantId') restaurantId: string) {
    return this.reviewsService.findAll(restaurantId);
  }
}

