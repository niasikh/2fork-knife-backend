import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AvailabilityService } from '../availability/availability.service';
import { CreateReservationDto, UpdateReservationDto, CancelReservationDto } from './dto';
import { ReservationStatus, ReservationSource } from '@prisma/client';
import { addHours } from 'date-fns';

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(
    private prisma: PrismaService,
    private availabilityService: AvailabilityService,
  ) {}

  /**
   * Create a new reservation
   */
  async create(dto: CreateReservationDto, userId: string) {
    // Check availability
    const availability = await this.availabilityService.checkAvailability(
      dto.restaurantId,
      new Date(dto.reservationDate),
      dto.startTime,
      dto.partySize,
    );

    if (!availability.available) {
      throw new BadRequestException(`Reservation not available: ${availability.reason}`);
    }

    // Get or create guest profile
    const guestProfile = await this.getOrCreateGuestProfile(
      dto.guestEmail,
      dto.guestPhone,
      dto.guestName,
    );

    // Select best available table
    const selectedTable = availability.tables && availability.tables[0];

    // Get restaurant policy
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: dto.restaurantId },
      include: { policy: true },
    });

    // Determine initial status
    const status =
      restaurant?.policy?.autoConfirm === false
        ? ReservationStatus.PENDING
        : ReservationStatus.CONFIRMED;

    // Create reservation
    const reservation = await this.prisma.reservation.create({
      data: {
        userId,
        restaurantId: dto.restaurantId,
        reservationDate: new Date(dto.reservationDate),
        startTime: dto.startTime,
        endTime: this.calculateEndTime(dto.startTime, 120), // Default 2 hours
        partySize: dto.partySize,
        guestName: dto.guestName,
        guestEmail: dto.guestEmail,
        guestPhone: dto.guestPhone,
        occasion: dto.occasion,
        specialRequests: dto.specialRequests,
        dietaryNotes: dto.dietaryNotes,
        seatingPreference: dto.seatingPreference,
        status,
        source: ReservationSource.APP,
        tableId: selectedTable?.id,
        guestProfileId: guestProfile?.id,
        experienceId: dto.experienceId,
        confirmedAt: status === ReservationStatus.CONFIRMED ? new Date() : undefined,
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
        table: {
          include: {
            area: true,
          },
        },
        experience: true,
      },
    });

    // Create audit log
    await this.createAuditLog(reservation.id, 'CREATED', userId, {});

    this.logger.log(`Reservation created: ${reservation.id} for ${dto.guestName}`);

    // TODO: Send confirmation notification

    return reservation;
  }

  /**
   * Find all reservations (with filters)
   */
  async findAll(filters?: {
    userId?: string;
    restaurantId?: string;
    status?: ReservationStatus;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: Record<string, unknown> = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.restaurantId) {
      where.restaurantId = filters.restaurantId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate && filters?.endDate) {
      where.reservationDate = {
        gte: filters.startDate,
        lte: filters.endDate,
      };
    }

    return this.prisma.reservation.findMany({
      where,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
            coverImage: true,
          },
        },
        table: {
          include: {
            area: true,
          },
        },
        experience: true,
      },
      orderBy: [{ reservationDate: 'asc' }, { startTime: 'asc' }],
    });
  }

  /**
   * Find one reservation by ID
   */
  async findOne(id: string, userId?: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: {
        restaurant: {
          include: {
            policy: true,
          },
        },
        table: {
          include: {
            area: true,
          },
        },
        experience: true,
        payment: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        guestProfile: true,
        auditLogs: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    // Check access
    if (userId && reservation.userId !== userId) {
      // Check if user is restaurant staff
      const isStaff = await this.isRestaurantStaff(reservation.restaurantId, userId);
      if (!isStaff) {
        throw new ForbiddenException('Access denied to this reservation');
      }
    }

    return reservation;
  }

  /**
   * Find reservation by confirmation code
   */
  async findByConfirmationCode(code: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { confirmationCode: code },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
          },
        },
        table: {
          include: {
            area: true,
          },
        },
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    return reservation;
  }

  /**
   * Update a reservation
   */
  async update(id: string, dto: UpdateReservationDto, userId: string) {
    const existing = await this.findOne(id, userId);

    // Check if modifications are allowed
    if (dto.reservationDate || dto.startTime || dto.partySize) {
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: existing.restaurantId },
        include: { policy: true },
      });

      if (restaurant?.policy?.allowModifications === false) {
        throw new BadRequestException('Modifications are not allowed for this restaurant');
      }

      // Check modification cutoff
      if (restaurant?.policy?.modificationCutoff) {
        const reservationTime = new Date(
          `${existing.reservationDate.toISOString().split('T')[0]}T${existing.startTime}`,
        );
        const cutoffTime = addHours(new Date(), restaurant.policy.modificationCutoff / 60);

        if (reservationTime < cutoffTime) {
          throw new BadRequestException('Modification cutoff time has passed for this reservation');
        }
      }

      // Check new availability if date/time/size changed
      if (dto.reservationDate || dto.startTime || dto.partySize) {
        const newDate = dto.reservationDate
          ? new Date(dto.reservationDate)
          : existing.reservationDate;
        const newTime = dto.startTime || existing.startTime;
        const newPartySize = dto.partySize || existing.partySize;

        const availability = await this.availabilityService.checkAvailability(
          existing.restaurantId,
          newDate,
          newTime,
          newPartySize,
        );

        if (!availability.available) {
          throw new BadRequestException(`New time not available: ${availability.reason}`);
        }
      }
    }

    // Create changes snapshot
    const changes = {
      before: existing,
      after: dto,
    };

    // Update reservation
    const updated = await this.prisma.reservation.update({
      where: { id },
      data: {
        ...dto,
        reservationDate: dto.reservationDate ? new Date(dto.reservationDate) : undefined,
      },
      include: {
        restaurant: true,
        table: {
          include: {
            area: true,
          },
        },
      },
    });

    // Create audit log
    await this.createAuditLog(id, 'MODIFIED', userId, changes);

    this.logger.log(`Reservation updated: ${id}`);

    // TODO: Send modification notification

    return updated;
  }

  /**
   * Cancel a reservation
   */
  async cancel(id: string, dto: CancelReservationDto, userId: string) {
    const reservation = await this.findOne(id, userId);

    if (reservation.status === ReservationStatus.CANCELLED) {
      throw new BadRequestException('Reservation is already cancelled');
    }

    if (reservation.status === ReservationStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed reservation');
    }

    // Check cancellation policy
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: reservation.restaurantId },
      include: { policy: true },
    });

    // TODO: Check if cancellation fee applies

    const updated = await this.prisma.reservation.update({
      where: { id },
      data: {
        status: ReservationStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: dto.reason,
      },
    });

    // Create audit log
    await this.createAuditLog(id, 'CANCELLED', userId, { reason: dto.reason });

    this.logger.log(`Reservation cancelled: ${id}`);

    // TODO: Send cancellation notification
    // TODO: Process refund if applicable

    return updated;
  }

  /**
   * Mark reservation as seated
   */
  async seat(id: string, userId: string) {
    const reservation = await this.findOne(id, userId);

    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new BadRequestException('Only confirmed reservations can be seated');
    }

    const updated = await this.prisma.reservation.update({
      where: { id },
      data: {
        status: ReservationStatus.SEATED,
        seatedAt: new Date(),
      },
    });

    await this.createAuditLog(id, 'SEATED', userId, {});

    this.logger.log(`Reservation seated: ${id}`);

    return updated;
  }

  /**
   * Mark reservation as completed
   */
  async complete(id: string, userId: string) {
    const reservation = await this.findOne(id, userId);

    if (reservation.status !== ReservationStatus.SEATED) {
      throw new BadRequestException('Only seated reservations can be completed');
    }

    const updated = await this.prisma.reservation.update({
      where: { id },
      data: {
        status: ReservationStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    // Update guest profile stats
    if (reservation.guestProfileId) {
      await this.updateGuestStats(reservation.guestProfileId);
    }

    await this.createAuditLog(id, 'COMPLETED', userId, {});

    this.logger.log(`Reservation completed: ${id}`);

    // TODO: Send feedback request

    return updated;
  }

  /**
   * Mark reservation as no-show
   */
  async markNoShow(id: string, userId: string) {
    const reservation = await this.findOne(id, userId);

    const updated = await this.prisma.reservation.update({
      where: { id },
      data: {
        status: ReservationStatus.NO_SHOW,
        completedAt: new Date(),
      },
    });

    // Update guest profile
    if (reservation.guestProfileId) {
      await this.prisma.guest.update({
        where: { id: reservation.guestProfileId },
        data: {
          noShowCount: { increment: 1 },
        },
      });
    }

    await this.createAuditLog(id, 'NO_SHOW', userId, {});

    this.logger.log(`Reservation marked as no-show: ${id}`);

    // TODO: Process no-show fee if applicable

    return updated;
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private async getOrCreateGuestProfile(email: string, phone: string, name: string) {
    let guest = await this.prisma.guest.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (!guest) {
      const nameParts = name.split(' ');
      const firstName = nameParts[0] ?? 'Guest';
      const lastName = nameParts.slice(1).join(' ') || firstName;

      guest = await this.prisma.guest.create({
        data: {
          email,
          phone,
          firstName,
          lastName,
        },
      });
    }

    return guest;
  }

  private calculateEndTime(startTime: string, durationMinutes: number): string {
    const parts = startTime.split(':').map(Number);
    const hours = parts[0] ?? 0;
    const minutes = parts[1] ?? 0;
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  }

  private async createAuditLog(
    reservationId: string,
    action: string,
    userId: string,
    changes: Record<string, unknown>,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        reservationId,
        action,
        performedBy: userId,
        performedByName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        changes: changes as any,
      },
    });
  }

  private async isRestaurantStaff(restaurantId: string, userId: string): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        OR: [{ restaurantId }, { role: 'ADMIN' }],
      },
    });

    return !!user;
  }

  private async updateGuestStats(guestId: string) {
    const reservations = await this.prisma.reservation.findMany({
      where: {
        guestProfileId: guestId,
        status: ReservationStatus.COMPLETED,
      },
      select: {
        partySize: true,
        reservationDate: true,
      },
    });

    const totalVisits = reservations.length;
    const avgPartySize =
      reservations.reduce((sum, r) => sum + r.partySize, 0) / totalVisits || null;
    const sortedReservations = reservations.sort(
      (a, b) => b.reservationDate.getTime() - a.reservationDate.getTime(),
    );
    const lastVisitDate = sortedReservations[0]?.reservationDate ?? null;

    await this.prisma.guest.update({
      where: { id: guestId },
      data: {
        totalVisits,
        avgPartySize,
        lastVisitDate,
      },
    });
  }
}
