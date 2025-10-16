import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';
import { NotificationProcessor } from './processors/notification.processor';
import { PaymentProcessor } from './processors/payment.processor';
import { ReservationJobsProcessor } from './processors/reservation-jobs.processor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
        },
      }),
    }),
    BullModule.registerQueue(
      { name: 'notifications' },
      { name: 'payments' },
      { name: 'pos-sync' },
      { name: 'reservation-jobs' },
    ),
    PrismaModule,
    NotificationsModule,
  ],
  providers: [NotificationProcessor, PaymentProcessor, ReservationJobsProcessor],
})
export class WorkerModule {}

