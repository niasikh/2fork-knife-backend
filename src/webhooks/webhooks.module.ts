import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { StripeWebhookController } from './stripe.controller';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'payments' }),
  ],
  controllers: [StripeWebhookController],
})
export class WebhooksModule {}

