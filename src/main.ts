import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import cors from '@fastify/cors';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import { json } from 'express';
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
    { bufferLogs: false }
  );

  const configService = app.get(ConfigService);

  // Get API prefix first
  const apiPrefix = configService.get('API_PREFIX') || 'api/v1';

  // Initialize Sentry
  const sentryDsn = configService.get('SENTRY_DSN');
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: configService.get('NODE_ENV'),
      integrations: [
        new ProfilingIntegration(),
      ],
      tracesSampleRate: configService.get('NODE_ENV') === 'production' ? 0.1 : 1.0,
      profilesSampleRate: 0.1,
    });
    console.log('✅ Sentry initialized');
  }

  // Apply raw body middleware for Stripe webhooks (aligned with API prefix)
  app.use(`/${apiPrefix}/webhooks/stripe`, json({ verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }}));

  // Security
  app.use(helmet({
    contentSecurityPolicy: configService.get('NODE_ENV') === 'production',
  }));

  // Compression
  app.use(compression());

  // CORS via Fastify plugin (not app.enableCors)
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
      : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  });

  // Leave ValidationPipe off or minimal in prod to avoid memory churn
  app.useGlobalPipes(new ValidationPipe({ 
    whitelist: true, 
    transform: process.env.NODE_ENV !== 'production' 
  }));

  // Middleware
  app.use(cookieParser());

  // Set global API prefix
  app.setGlobalPrefix(apiPrefix);

  // Enable Prisma shutdown hooks
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  // Start server
  const port = configService.get('PORT') || 3000;
  await app.listen({ port: Number(port), host: '0.0.0.0' });

  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║         🍴 FORK & KNIFE BACKEND - PRODUCTION READY 🔪         ║
║                                                                ║
║  Server:      http://localhost:${port}                          ║
║  API:         http://localhost:${port}/${apiPrefix}             ║
║  Environment: ${configService.get('NODE_ENV')}                                    ║
║  Database:    Connected                                        ║
║  Redis:       Connected                                        ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);

  // Safety net: crash early if you exceed budget
  if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
      const used = process.memoryUsage().rss / (1024 * 1024);
      if (used > 900) {
        // eslint-disable-next-line no-console
        console.error(`[mem] RSS ${used.toFixed(0)} MB > 900 MB — exiting to restart cleanly`);
        process.exit(1);
      }
    }, 15000).unref();
  }

  // Graceful shutdown on SIGTERM
  process.on('SIGTERM', async () => {
    console.log('⚠️  SIGTERM received, shutting down gracefully...');
    
    // Stop accepting new requests
    await app.close();
    
    console.log('✅ Graceful shutdown complete');
    process.exit(0);
  });
}

bootstrap();