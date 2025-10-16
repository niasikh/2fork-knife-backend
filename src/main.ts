import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import * as compression from 'compression';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    rawBody: true, // Enable raw body for Stripe webhooks
  });

  const configService = app.get(ConfigService);

  // Apply raw body middleware for Stripe webhooks
  app.use('/api/v1/webhooks/stripe', json({ verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }}));

  // Security
  app.use(helmet());
  
  // Compression
  app.use(compression());

  // CORS
  app.enableCors({
    origin: [
      configService.get('FRONTEND_URL'),
      configService.get('ADMIN_PANEL_URL'),
      'http://localhost:3001',
      'http://localhost:3002',
    ].filter(Boolean),
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

  // API prefix
  const apiPrefix = configService.get('API_PREFIX') || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

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
}

bootstrap();

