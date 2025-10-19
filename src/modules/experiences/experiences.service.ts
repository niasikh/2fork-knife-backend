import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ExperiencesService {
  constructor(private prisma: PrismaService) {}

  async findAll(restaurantId?: string) {
    const where: any = { isActive: true };
    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    return this.prisma.experience.findMany({
      where,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
      orderBy: {
        eventDate: 'asc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.experience.findUnique({
      where: { id },
      include: {
        restaurant: true,
        reservations: {
          where: {
            status: {
              in: ['CONFIRMED', 'SEATED'],
            },
          },
        },
      },
    });
  }
}
