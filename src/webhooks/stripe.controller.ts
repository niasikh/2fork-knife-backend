import { Controller, Post, Req, Res, Logger, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Public } from '../common/decorators/public.decorator';

@Controller('webhooks')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);
  private stripe: Stripe;

  constructor(
    private config: ConfigService,
    @InjectQueue('payments') private paymentQueue: Queue,
  ) {
    this.stripe = new Stripe(this.config.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2024-12-18.acacia',
    });
  }

  @Public()
  @Post('stripe')
  async handleStripeWebhook(@Req() req: Request, @Res() res: Response) {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET');

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = this.stripe.webhooks.constructEvent(
        req.body, // Raw body required
        sig as string,
        webhookSecret,
      );
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(HttpStatus.BAD_REQUEST).send(`Webhook Error: ${err.message}`);
    }

    this.logger.log(`Received Stripe webhook: ${event.type}`);

    // Enqueue job for async processing
    try {
      await this.enqueueWebhookEvent(event);
      
      // Return 200 immediately
      return res.status(HttpStatus.OK).json({ received: true });
    } catch (error) {
      this.logger.error(`Failed to enqueue webhook: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Failed to process webhook');
    }
  }

  private async enqueueWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.paymentQueue.add('payment-succeeded', {
          paymentIntentId: event.data.object.id,
          amount: event.data.object.amount,
          metadata: event.data.object.metadata,
        });
        break;

      case 'payment_intent.payment_failed':
        await this.paymentQueue.add('payment-failed', {
          paymentIntentId: event.data.object.id,
          error: event.data.object.last_payment_error,
        });
        break;

      case 'charge.refunded':
        await this.paymentQueue.add('refund-processed', {
          chargeId: event.data.object.id,
          amount: event.data.object.amount_refunded,
        });
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }
}

