import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  @Get()
  async check() {
    const checks = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: this.config.get('NODE_ENV'),
      version: '1.0.0',
      services: {
        database: 'unknown',
        redis: 'unknown',
      },
    };

    // Check database
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.services.database = 'connected';
    } catch (error) {
      checks.services.database = 'disconnected';
      checks.status = 'degraded';
    }

    // TODO: Check Redis when implemented
    checks.services.redis = 'not_configured';

    return checks;
  }

  @Get('ready')
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        status: 'not_ready',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('live')
  live() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }
}
