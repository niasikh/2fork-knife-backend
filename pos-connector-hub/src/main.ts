import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3100;
  await app.listen(port);

  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║       🔌 POS CONNECTOR HUB - RUNNING                  ║
║                                                        ║
║  Port:        ${port}                                      ║
║  Environment: ${process.env.NODE_ENV}                             ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
}

bootstrap();

