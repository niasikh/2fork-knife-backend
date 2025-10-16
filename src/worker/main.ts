import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Worker');
  
  // Create worker-only app context (no HTTP server)
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: ['error', 'warn', 'log'],
  });

  logger.log('🔄 BullMQ Worker started');
  logger.log(`Connected to Redis: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
  logger.log('Listening for jobs: notifications, payments, pos-sync');

  // Keep process alive
  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received, shutting down gracefully');
    await app.close();
    process.exit(0);
  });
}

bootstrap();

