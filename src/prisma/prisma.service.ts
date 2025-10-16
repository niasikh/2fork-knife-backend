import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connected successfully');
    } catch (error) {
      this.logger.error('❌ Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  // Helper for transactions with proper typing
  async transaction<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    return this.$transaction(fn);
  }

  // Soft delete helper (if you add deletedAt field)
  async softDelete(model: string, id: string) {
    const prismaModel = (this as any)[model];
    if (!prismaModel || typeof prismaModel.update !== 'function') {
      throw new Error(`Invalid model: ${model}`);
    }
    return prismaModel.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Clean disconnect for tests
  async cleanDisconnect() {
    await this.$disconnect();
  }
}

