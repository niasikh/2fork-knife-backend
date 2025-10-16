import { Controller, Get, Param } from '@nestjs/common';
import { MenuService } from './menu.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('menu')
export class MenuController {
  constructor(private menuService: MenuService) {}

  @Public()
  @Get('restaurant/:restaurantId')
  async findAll(@Param('restaurantId') restaurantId: string) {
    return this.menuService.findAll(restaurantId);
  }
}

