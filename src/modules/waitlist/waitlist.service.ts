import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WaitlistService {
  constructor(private prisma: PrismaService) {}

  async findAll(restaurantId: string, date: Date) {
    return this.prisma.waitlist.findMany({
      where: {
        restaurantId,
        date,
        status: 'WAITING',
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }
}
