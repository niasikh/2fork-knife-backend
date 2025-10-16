import { Module } from '@nestjs/common';
import { AdaptersModule } from '../adapters/adapters.module';

@Module({
  imports: [AdaptersModule],
  controllers: [],
  providers: [],
})
export class WebhookModule {}

