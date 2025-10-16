import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ReservationsService } from '../../modules/reservations/reservations.service';
import { ReservationType } from '../types/reservation.type';
import { CreateReservationInput } from '../inputs/create-reservation.input';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Resolver(() => ReservationType)
@UseGuards(JwtAuthGuard)
export class ReservationResolver {
  constructor(private reservationsService: ReservationsService) {}

  @Query(() => [ReservationType], { name: 'myReservations' })
  async getMyReservations(@CurrentUser() user: any) {
    return this.reservationsService.findAll({ userId: user.id });
  }

  @Query(() => ReservationType, { name: 'reservation' })
  async getReservation(@Args('id') id: string, @CurrentUser() user: any) {
    return this.reservationsService.findOne(id, user.id);
  }

  @Mutation(() => ReservationType, { name: 'createReservation' })
  async createReservation(
    @Args('input') input: CreateReservationInput,
    @CurrentUser() user: any,
  ) {
    return this.reservationsService.create(input, user.id);
  }

  @Mutation(() => ReservationType, { name: 'cancelReservation' })
  async cancelReservation(
    @Args('id') id: string,
    @Args('reason', { nullable: true }) reason: string,
    @CurrentUser() user: any,
  ) {
    return this.reservationsService.cancel(id, { reason }, user.id);
  }
}

