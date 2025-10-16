import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AdaptersModule } from './adapters/adapters.module';
import { SyncModule } from './sync/sync.module';
import { WebhookModule } from './webhook/webhook.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    AdaptersModule,
    SyncModule,
    WebhookModule,
    HealthModule,
  ],
})
export class AppModule {}

