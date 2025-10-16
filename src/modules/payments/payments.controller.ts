import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('intent')
  async createIntent(@Body() body: { reservationId: string; amount: number }) {
    return this.paymentsService.createPaymentIntent(body.reservationId, body.amount);
  }
}

