import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import fastifyCors from '@fastify/cors';

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
    new FastifyAdapter({ logger: false }),
    { bufferLogs: false }
  );

  await (app as any).register(fastifyCors as any, {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
      : true,
    credentials: true,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS']
  });

  await app.listen(Number(process.env.PORT) || 3000, '0.0.0.0');
}
bootstrap();