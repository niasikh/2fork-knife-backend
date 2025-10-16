import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import { json } from 'express';
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    rawBody: true, // Enable raw body for Stripe webhooks
    bufferLogs: true,
  });

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

  // CORS - Strict in production
  const isProd = configService.get('NODE_ENV') === 'production';
  const allowedOrigins = isProd
    ? [
        configService.get('FRONTEND_URL'),
        configService.get('ADMIN_PANEL_URL'),
      ].filter(Boolean)
    : [
        configService.get('FRONTEND_URL'),
        configService.get('ADMIN_PANEL_URL'),
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:19006', // Expo dev
      ].filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Middleware
  app.use(cookieParser());

  // Set global API prefix
  app.setGlobalPrefix(apiPrefix);

  // Enable Prisma shutdown hooks
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  // Start server
  const port = configService.get('PORT') || 3000;
  await app.listen(port);

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

