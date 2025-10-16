import { Controller, Get, Param, Query } from '@nestjs/common';
import { ExperiencesService } from './experiences.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('experiences')
export class ExperiencesController {
  constructor(private experiencesService: ExperiencesService) {}

  @Public()
  @Get()
  async findAll(@Query('restaurantId') restaurantId?: string) {
    return this.experiencesService.findAll(restaurantId);
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.experiencesService.findOne(id);
  }
}

