import { INestApplication, Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['warn','error'] : ['error'],
      datasources: { db: { url: process.env.DATABASE_URL } }
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await this.$disconnect();
      await app.close();
    });
  }
}

// prevent multiple clients in dev/hot reload
const g = global as unknown as { prisma?: PrismaService };
export const prisma = g.prisma ?? new PrismaService();
if (process.env.NODE_ENV !== 'production') g.prisma = prisma;