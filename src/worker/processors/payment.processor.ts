import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('payments')
export class PaymentProcessor extends WorkerHost {
  private readonly logger = new Logger(PaymentProcessor.name);

  async process(job: Job): Promise<unknown> {
    this.logger.log(`Processing payment job ${job.id}: ${job.name}`);

    try {
      switch (job.name) {
        case 'process-refund':
          return await this.processRefund(job.data);
        case 'capture-hold':
          return await this.captureHold(job.data);
        case 'charge-no-show-fee':
          return await this.chargeNoShowFee(job.data);
        default:
          this.logger.warn(`Unknown job type: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(`Job ${job.id} failed:`, error);
      throw error;
    }
  }

  private async processRefund(data: Record<string, unknown>) {
    this.logger.log(`Processing refund for reservation ${data.reservationId}`);
    // TODO: Implement Stripe refund
    return { refunded: true, amount: data.amount };
  }

  private async captureHold(data: Record<string, unknown>) {
    this.logger.log(`Capturing payment hold ${data.paymentIntentId}`);
    return { captured: true };
  }

  private async chargeNoShowFee(data: Record<string, unknown>) {
    this.logger.log(`Charging no-show fee for reservation ${data.reservationId}`);
    return { charged: true, amount: data.feeAmount };
  }
}
