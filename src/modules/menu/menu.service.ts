import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  async findAll(restaurantId: string) {
    return this.prisma.menuItem.findMany({
      where: {
        restaurantId,
        isAvailable: true,
      },
      orderBy: [
        { category: 'asc' },
        { sortOrder: 'asc' },
      ],
    });
  }
}

