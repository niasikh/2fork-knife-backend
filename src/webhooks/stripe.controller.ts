import { Controller, Post, Req, Res, Logger, HttpStatus, RawBodyRequest } from '@nestjs/common';
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
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
  ) {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      this.logger.error('STRIPE_WEBHOOK_SECRET not configured');
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Webhook not configured');
    }

    let event: Stripe.Event;

    try {
      // Use raw body for signature verification
      const rawBody = req.rawBody || req.body;
      
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        sig as string,
        webhookSecret,
      );
    } catch (err) {
      this.logger.error(`⚠️ Webhook signature verification failed: ${err.message}`);
      return res.status(HttpStatus.BAD_REQUEST).send(`Webhook Error: ${err.message}`);
    }

    this.logger.log(`✅ Verified Stripe webhook: ${event.type}`);

    // Enqueue job for async processing - return 200 fast
    try {
      await this.enqueueWebhookEvent(event);
      
      // Return 200 immediately (Stripe requirement)
      return res.status(HttpStatus.OK).json({ received: true });
    } catch (error) {
      this.logger.error(`Failed to enqueue webhook: ${error.message}`);
      // Still return 200 to prevent Stripe retries
      return res.status(HttpStatus.OK).json({ received: true, queued: false });
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

