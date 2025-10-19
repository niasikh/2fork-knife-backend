import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('reservation-jobs')
export class ReservationJobsProcessor extends WorkerHost {
  private readonly logger = new Logger(ReservationJobsProcessor.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing reservation job ${job.id}: ${job.name}`);

    try {
      switch (job.name) {
        case 'send-confirmation':
          return await this.sendConfirmation(job.data);

        case 'send-reminder':
          return await this.sendReminder(job.data);

        case 'process-no-show':
          return await this.processNoShow(job.data);

        case 'check-late-arrival':
          return await this.checkLateArrival(job.data);

        case 'update-guest-stats':
          return await this.updateGuestStats(job.data);

        default:
          this.logger.warn(`Unknown job type: ${job.name}`);
          return { skipped: true };
      }
    } catch (error) {
      this.logger.error(`Job ${job.id} failed:`, error);
      throw error; // Will trigger retry based on job options
    }
  }

  private async sendConfirmation(data: { reservationId: string }) {
    this.logger.log(`Sending confirmation for reservation ${data.reservationId}`);

    const reservation = await this.prisma.reservation.findUnique({
      where: { id: data.reservationId },
      include: { restaurant: true },
    });

    if (!reservation) {
      throw new Error(`Reservation ${data.reservationId} not found`);
    }

    // TODO: Actually send email/SMS
    this.logger.log(`Would send confirmation to ${reservation.guestEmail}`);

    return { sent: true, to: reservation.guestEmail };
  }

  private async sendReminder(data: { reservationId: string }) {
    this.logger.log(`Sending reminder for reservation ${data.reservationId}`);

    const reservation = await this.prisma.reservation.findUnique({
      where: { id: data.reservationId },
    });

    if (!reservation) {
      return { skipped: true, reason: 'Reservation not found' };
    }

    // Don't send if cancelled
    if (reservation.status === 'CANCELLED' || reservation.status === 'NO_SHOW') {
      return { skipped: true, reason: 'Reservation cancelled/no-show' };
    }

    // TODO: Send reminder
    return { sent: true };
  }

  private async processNoShow(data: { reservationId: string }) {
    this.logger.log(`Processing no-show for ${data.reservationId}`);

    // Update reservation status
    await this.prisma.reservation.update({
      where: { id: data.reservationId },
      data: {
        status: 'NO_SHOW',
        completedAt: new Date(),
      },
    });

    // TODO: Process no-show fee if applicable

    return { processed: true };
  }

  private async checkLateArrival(_data: { reservationId: string }) {
    // Check if guest is late
    return { checked: true };
  }

  private async updateGuestStats(data: { guestId: string }) {
    const reservations = await this.prisma.reservation.findMany({
      where: {
        guestProfileId: data.guestId,
        status: 'COMPLETED',
      },
    });

    const stats = {
      totalVisits: reservations.length,
      avgPartySize: reservations.reduce((sum, r) => sum + r.partySize, 0) / reservations.length,
      lastVisitDate: reservations[reservations.length - 1]?.reservationDate,
    };

    await this.prisma.guest.update({
      where: { id: data.guestId },
      data: stats,
    });

    return { updated: true, stats };
  }
}
