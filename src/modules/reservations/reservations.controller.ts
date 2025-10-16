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
import { ReservationsService } from './reservations.service';
import { CreateReservationDto, UpdateReservationDto, CancelReservationDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole, ReservationStatus } from '@prisma/client';

@Controller('reservations')
export class ReservationsController {
  constructor(private reservationsService: ReservationsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateReservationDto, @CurrentUser() user: any) {
    return this.reservationsService.create(dto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query('restaurantId') restaurantId?: string,
    @Query('status') status?: ReservationStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // If user is customer, only show their reservations
    // If user is restaurant staff, show restaurant reservations
    const filters: any = {};

    if (user.role === UserRole.CUSTOMER) {
      filters.userId = user.id;
    } else if (restaurantId) {
      filters.restaurantId = restaurantId;
    }

    if (status) {
      filters.status = status;
    }

    if (startDate && endDate) {
      filters.startDate = new Date(startDate);
      filters.endDate = new Date(endDate);
    }

    return this.reservationsService.findAll(filters);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reservationsService.findOne(id, user.id);
  }

  @Public()
  @Get('confirmation/:code')
  async findByConfirmationCode(@Param('code') code: string) {
    return this.reservationsService.findByConfirmationCode(code);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateReservationDto,
    @CurrentUser() user: any,
  ) {
    return this.reservationsService.update(id, dto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelReservationDto,
    @CurrentUser() user: any,
  ) {
    return this.reservationsService.cancel(id, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.RESTAURANT_HOST,
    UserRole.RESTAURANT_MANAGER,
    UserRole.RESTAURANT_OWNER,
    UserRole.ADMIN,
  )
  @Post(':id/seat')
  async seat(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reservationsService.seat(id, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.RESTAURANT_HOST,
    UserRole.RESTAURANT_MANAGER,
    UserRole.RESTAURANT_OWNER,
    UserRole.ADMIN,
  )
  @Post(':id/complete')
  async complete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reservationsService.complete(id, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.RESTAURANT_HOST,
    UserRole.RESTAURANT_MANAGER,
    UserRole.RESTAURANT_OWNER,
    UserRole.ADMIN,
  )
  @Post(':id/no-show')
  async markNoShow(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reservationsService.markNoShow(id, user.id);
  }
}

