import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { format } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz';

@Injectable()
export class AvailabilityService {
  private readonly logger = new Logger(AvailabilityService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Check availability for a specific date, time, and party size
   */
  async checkAvailability(
    restaurantId: string,
    date: Date,
    time: string,
    partySize: number,
  ) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        policy: true,
        shifts: {
          where: { isActive: true },
        },
        blocks: true,
      },
    });

    if (!restaurant) {
      return { available: false, reason: 'Restaurant not found' };
    }

    // Check if restaurant is blocked for this date/time
    const isBlocked = await this.isDateTimeBlocked(restaurant.blocks, date, time);
    if (isBlocked) {
      return { available: false, reason: 'Restaurant is closed for this time' };
    }

    // Check booking windows
    const policy = restaurant.policy;
    if (policy) {
      const now = new Date();
      const bookingDateTime = this.combineDateAndTime(date, time, restaurant.timezone);

      // Check minimum advance time
      const minAdvanceMs = policy.minAdvanceMinutes * 60 * 1000;
      if (bookingDateTime.getTime() - now.getTime() < minAdvanceMs) {
        return {
          available: false,
          reason: `Bookings must be made at least ${policy.minAdvanceMinutes} minutes in advance`,
        };
      }

      // Check maximum advance time
      const maxAdvanceMs = policy.maxAdvanceDays * 24 * 60 * 60 * 1000;
      if (bookingDateTime.getTime() - now.getTime() > maxAdvanceMs) {
        return {
          available: false,
          reason: `Bookings can only be made up to ${policy.maxAdvanceDays} days in advance`,
        };
      }
    }

    // Get applicable shift
    const dayOfWeek = date.getDay();
    const shift = restaurant.shifts.find(
      (s) => s.dayOfWeek === dayOfWeek && this.isTimeWithinShift(time, s.startTime, s.endTime),
    );

    if (!shift) {
      return { available: false, reason: 'No service during this time' };
    }

    // Check shift capacity
    if (shift.maxCovers) {
      const existingCovers = await this.getCoversForShift(restaurantId, date, shift.id);
      if (existingCovers + partySize > shift.maxCovers) {
        return { available: false, reason: 'Shift is fully booked' };
      }
    }

    // Check table availability
    const availableTables = await this.getAvailableTables(
      restaurantId,
      date,
      time,
      partySize,
      shift,
    );

    if (availableTables.length === 0) {
      return { available: false, reason: 'No tables available for this party size' };
    }

    return {
      available: true,
      tables: availableTables,
      shift: shift,
    };
  }

  /**
   * Get available time slots for a given date
   */
  async getAvailableSlots(restaurantId: string, date: Date, partySize: number) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        shifts: {
          where: { isActive: true },
        },
      },
    });

    if (!restaurant) {
      return [];
    }

    const dayOfWeek = date.getDay();
    const shifts = restaurant.shifts.filter((s) => s.dayOfWeek === dayOfWeek);

    const allSlots = [];

    for (const shift of shifts) {
      const slots = this.generateTimeSlots(shift.startTime, shift.endTime, shift.slotDuration);

      for (const slot of slots) {
        const availability = await this.checkAvailability(restaurantId, date, slot, partySize);
        allSlots.push({
          time: slot,
          available: availability.available,
          shift: shift.name,
        });
      }
    }

    return allSlots;
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private async isDateTimeBlocked(blocks: any[], date: Date, time: string): Promise<boolean> {
    for (const block of blocks) {
      const blockStart = new Date(block.startDate);
      const blockEnd = new Date(block.endDate);

      // Check if date is within block range
      if (date >= blockStart && date <= blockEnd) {
        // If no specific time range, entire day is blocked
        if (!block.startTime || !block.endTime) {
          return true;
        }

        // Check if time is within block time range
        if (this.isTimeWithinRange(time, block.startTime, block.endTime)) {
          return true;
        }
      }
    }

    return false;
  }

  private isTimeWithinShift(time: string, startTime: string, endTime: string): boolean {
    const timeMinutes = this.timeToMinutes(time);
    const startMinutes = this.timeToMinutes(startTime);
    let endMinutes = this.timeToMinutes(endTime);

    // Handle overnight shifts
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }

    return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
  }

  private isTimeWithinRange(time: string, startTime: string, endTime: string): boolean {
    return this.isTimeWithinShift(time, startTime, endTime);
  }

  private timeToMinutes(time: string): number {
    const parts = time.split(':').map(Number);
    const hours = parts[0] ?? 0;
    const minutes = parts[1] ?? 0;
    return hours * 60 + minutes;
  }

  private combineDateAndTime(date: Date, time: string, timezone: string): Date {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dateTimeStr = `${dateStr}T${time}:00`;
    return zonedTimeToUtc(dateTimeStr, timezone);
  }

  private generateTimeSlots(startTime: string, endTime: string, slotDuration: number): string[] {
    const slots = [];
    let currentMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);

    while (currentMinutes < endMinutes) {
      const hours = Math.floor(currentMinutes / 60);
      const minutes = currentMinutes % 60;
      slots.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
      currentMinutes += slotDuration;
    }

    return slots;
  }

  private async getCoversForShift(
    restaurantId: string,
    date: Date,
    _shiftId: string,
  ): Promise<number> {
    const reservations = await this.prisma.reservation.findMany({
      where: {
        restaurantId,
        reservationDate: date,
        status: {
          in: ['PENDING', 'CONFIRMED', 'SEATED'],
        },
      },
      select: {
        partySize: true,
      },
    });

    return reservations.reduce((total, r) => total + r.partySize, 0);
  }

  private async getAvailableTables(
    restaurantId: string,
    date: Date,
    time: string,
    partySize: number,
    _shift: any,
  ) {
    // Get all tables that can accommodate party size
    const tables = await this.prisma.table.findMany({
      where: {
        restaurantId,
        isActive: true,
        minSeats: { lte: partySize },
        maxSeats: { gte: partySize },
      },
      include: {
        area: true,
      },
    });

    // Get reservations for this time slot
    const reservations = await this.prisma.reservation.findMany({
      where: {
        restaurantId,
        reservationDate: date,
        status: {
          in: ['PENDING', 'CONFIRMED', 'SEATED'],
        },
      },
      include: {
        table: true,
      },
    });

    // Filter out tables that are already reserved for overlapping times
    const availableTables = tables.filter((table) => {
      const tableReservations = reservations.filter((r) => r.tableId === table.id);

      for (const reservation of tableReservations) {
        // Check if times overlap (simplified - assumes 2 hour reservation)
        const reservationTime = this.timeToMinutes(reservation.startTime);
        const requestedTime = this.timeToMinutes(time);

        // If within 2 hours, consider it overlapping
        if (Math.abs(reservationTime - requestedTime) < 120) {
          return false;
        }
      }

      return true;
    });

    return availableTables;
  }
}

