import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GuestsService {
  constructor(private prisma: PrismaService) {}

  async findAll(restaurantId?: string) {
    return this.prisma.guest.findMany({
      include: {
        notes: true,
        _count: {
          select: {
            reservations: true,
          },
        },
      },
      orderBy: {
        lastVisitDate: 'desc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.guest.findUnique({
      where: { id },
      include: {
        notes: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        reservations: {
          orderBy: {
            reservationDate: 'desc',
          },
          take: 10,
        },
      },
    });
  }

  async addNote(guestId: string, content: string, createdBy: string, isInternal = true) {
    return this.prisma.guestNote.create({
      data: {
        guestId,
        content,
        createdBy,
        isInternal,
      },
    });
  }

  async updateTags(guestId: string, tags: string[]) {
    return this.prisma.guest.update({
      where: { id: guestId },
      data: { tags },
    });
  }
}

