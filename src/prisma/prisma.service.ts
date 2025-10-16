import { INestApplication, Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query','warn','error'] : ['error'],
      datasources: { db: { url: process.env.DATABASE_URL } },

      // Small, defensive timeouts so the engine doesn't hoard memory
      // @ts-ignore - __internal is intentionally undocumented
      __internal: {
        engine: {
          // millis
          connectTimeout: 20000,
          queryTimeout: 20000
        }
      }
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

// Prevent multiple Prisma clients in dev/hot-reload
const globalForPrisma = global as unknown as { prisma?: PrismaService };
export const prisma = globalForPrisma.prisma ?? new PrismaService();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;