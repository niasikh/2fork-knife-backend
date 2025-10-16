import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import {
  CreateRestaurantDto,
  UpdateRestaurantDto,
  CreateAreaDto,
  CreateTableDto,
  CreateShiftDto,
  UpdatePolicyDto,
  CreateBlockDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '@prisma/client';

@Controller('restaurants')
export class RestaurantsController {
  constructor(private restaurantsService: RestaurantsService) {}

  // ============================================
  // RESTAURANT CRUD
  // ============================================

  @Public()
  @Get()
  async findAll(
    @Query('city') city?: string,
    @Query('cuisine') cuisine?: string,
    @Query('priceRange') priceRange?: string,
    @Query('search') search?: string,
  ) {
    return this.restaurantsService.findAll({
      city,
      cuisine,
      priceRange: priceRange ? parseInt(priceRange) : undefined,
      search,
      isActive: true,
    });
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.restaurantsService.findOne(id);
  }

  @Public()
  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.restaurantsService.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
  @Post()
  async create(@Body() dto: CreateRestaurantDto, @CurrentUser() user: any) {
    return this.restaurantsService.create(dto, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_MANAGER,
    UserRole.ADMIN,
  )
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRestaurantDto,
    @CurrentUser() user: any,
  ) {
    return this.restaurantsService.update(id, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.restaurantsService.delete(id, user.id);
  }

  // ============================================
  // AREAS
  // ============================================

  @UseGuards(JwtAuthGuard)
  @Get(':restaurantId/areas')
  async getAreas(@Param('restaurantId') restaurantId: string) {
    return this.restaurantsService.getAreas(restaurantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_MANAGER,
    UserRole.ADMIN,
  )
  @Post(':restaurantId/areas')
  async createArea(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: CreateAreaDto,
    @CurrentUser() user: any,
  ) {
    return this.restaurantsService.createArea(restaurantId, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_MANAGER,
    UserRole.ADMIN,
  )
  @Put('areas/:areaId')
  async updateArea(
    @Param('areaId') areaId: string,
    @Body() dto: Partial<CreateAreaDto>,
    @CurrentUser() user: any,
  ) {
    return this.restaurantsService.updateArea(areaId, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_MANAGER,
    UserRole.ADMIN,
  )
  @Delete('areas/:areaId')
  async deleteArea(@Param('areaId') areaId: string, @CurrentUser() user: any) {
    return this.restaurantsService.deleteArea(areaId, user.id);
  }

  // ============================================
  // TABLES
  // ============================================

  @UseGuards(JwtAuthGuard)
  @Get(':restaurantId/tables')
  async getTables(@Param('restaurantId') restaurantId: string) {
    return this.restaurantsService.getTables(restaurantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_MANAGER,
    UserRole.ADMIN,
  )
  @Post(':restaurantId/tables')
  async createTable(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: CreateTableDto,
    @CurrentUser() user: any,
  ) {
    return this.restaurantsService.createTable(restaurantId, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_MANAGER,
    UserRole.ADMIN,
  )
  @Put('tables/:tableId')
  async updateTable(
    @Param('tableId') tableId: string,
    @Body() dto: Partial<CreateTableDto>,
    @CurrentUser() user: any,
  ) {
    return this.restaurantsService.updateTable(tableId, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_MANAGER,
    UserRole.ADMIN,
  )
  @Delete('tables/:tableId')
  async deleteTable(@Param('tableId') tableId: string, @CurrentUser() user: any) {
    return this.restaurantsService.deleteTable(tableId, user.id);
  }

  // ============================================
  // SHIFTS
  // ============================================

  @Public()
  @Get(':restaurantId/shifts')
  async getShifts(
    @Param('restaurantId') restaurantId: string,
    @Query('dayOfWeek') dayOfWeek?: string,
  ) {
    return this.restaurantsService.getShifts(
      restaurantId,
      dayOfWeek ? parseInt(dayOfWeek) : undefined,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_MANAGER,
    UserRole.ADMIN,
  )
  @Post(':restaurantId/shifts')
  async createShift(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: CreateShiftDto,
    @CurrentUser() user: any,
  ) {
    return this.restaurantsService.createShift(restaurantId, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_MANAGER,
    UserRole.ADMIN,
  )
  @Put('shifts/:shiftId')
  async updateShift(
    @Param('shiftId') shiftId: string,
    @Body() dto: Partial<CreateShiftDto>,
    @CurrentUser() user: any,
  ) {
    return this.restaurantsService.updateShift(shiftId, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_MANAGER,
    UserRole.ADMIN,
  )
  @Delete('shifts/:shiftId')
  async deleteShift(@Param('shiftId') shiftId: string, @CurrentUser() user: any) {
    return this.restaurantsService.deleteShift(shiftId, user.id);
  }

  // ============================================
  // POLICIES
  // ============================================

  @Public()
  @Get(':restaurantId/policy')
  async getPolicy(@Param('restaurantId') restaurantId: string) {
    return this.restaurantsService.getPolicy(restaurantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_MANAGER,
    UserRole.ADMIN,
  )
  @Put(':restaurantId/policy')
  async updatePolicy(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: UpdatePolicyDto,
    @CurrentUser() user: any,
  ) {
    return this.restaurantsService.updatePolicy(restaurantId, dto, user.id);
  }

  // ============================================
  // BLOCKS (Closures)
  // ============================================

  @UseGuards(JwtAuthGuard)
  @Get(':restaurantId/blocks')
  async getBlocks(
    @Param('restaurantId') restaurantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.restaurantsService.getBlocks(
      restaurantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_MANAGER,
    UserRole.ADMIN,
  )
  @Post(':restaurantId/blocks')
  async createBlock(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: CreateBlockDto,
    @CurrentUser() user: any,
  ) {
    return this.restaurantsService.createBlock(restaurantId, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_MANAGER,
    UserRole.ADMIN,
  )
  @Delete('blocks/:blockId')
  async deleteBlock(@Param('blockId') blockId: string, @CurrentUser() user: any) {
    return this.restaurantsService.deleteBlock(blockId, user.id);
  }
}

