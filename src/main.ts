import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyCors from '@fastify/cors';
import fastifyRawBody from 'fastify-raw-body';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
    { bufferLogs: false },
  );

  // Get underlying Fastify instance and register plugins there
  const fastify = app.getHttpAdapter().getInstance();

  await fastify.register(fastifyCors, {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
      : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Raw body only for the Stripe route
  await fastify.register(fastifyRawBody, {
    field: 'rawBody',
    global: false,
    routes: ['/webhooks/stripe'],
  });

  await app.listen(Number(process.env.PORT) || 3000, '0.0.0.0');

  // Optional guard to avoid death-by-leak while you harden things
  if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
      const rss = process.memoryUsage().rss / (1024 * 1024);
      if (rss > 900) {
        // eslint-disable-next-line no-console
        console.error(`[mem] RSS ${rss.toFixed(0)} MB > 900 MB — exiting`);
        process.exit(1);
      }
    }, 15000).unref();
  }
}
bootstrap();
