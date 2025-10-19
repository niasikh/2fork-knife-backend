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
  logger.log('Listening for jobs: notifications, payments, pos-sync, reservation-jobs');

  // Graceful shutdown on SIGTERM
  process.on('SIGTERM', async () => {
    logger.log('⚠️  SIGTERM received, pausing workers and draining current jobs...');

    // Get worker instances from module
    const moduleRef = app.select(WorkerModule);
    const workers = moduleRef.get('BullMQWorkers', { strict: false });

    // Pause workers to stop accepting new jobs
    if (workers && Array.isArray(workers)) {
      await Promise.all(
        workers.map((worker: { pause: (wait: boolean) => Promise<void> }) => worker.pause(true)),
      );
      logger.log('Workers paused, waiting for current jobs to complete...');
    }

    // Close application context (drains current jobs)
    await app.close();

    logger.log('✅ Worker shutdown complete');
    process.exit(0);
  });
}

bootstrap();
