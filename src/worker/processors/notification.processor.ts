import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  async process(job: Job): Promise<unknown> {
    this.logger.log(`Processing notification job ${job.id}: ${job.name}`);

    try {
      switch (job.name) {
        case 'send-confirmation':
          return await this.sendConfirmation(job.data);
        case 'send-reminder':
          return await this.sendReminder(job.data);
        case 'send-cancellation':
          return await this.sendCancellation(job.data);
        default:
          this.logger.warn(`Unknown job type: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(`Job ${job.id} failed:`, error);
      throw error; // BullMQ will retry based on job options
    }
  }

  private async sendConfirmation(data: Record<string, unknown>) {
    // TODO: Implement email/SMS sending
    this.logger.log(`Sending confirmation to ${data.email}`);
    // await this.notificationService.sendEmail(...)
    return { sent: true, timestamp: new Date() };
  }

  private async sendReminder(data: Record<string, unknown>) {
    this.logger.log(`Sending reminder to ${data.email}`);
    return { sent: true, timestamp: new Date() };
  }

  private async sendCancellation(data: Record<string, unknown>) {
    this.logger.log(`Sending cancellation to ${data.email}`);
    return { sent: true, timestamp: new Date() };
  }
}
