import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateRestaurantDto,
  UpdateRestaurantDto,
  CreateAreaDto,
  CreateTableDto,
  CreateShiftDto,
  UpdatePolicyDto,
  CreateBlockDto,
} from './dto';

@Injectable()
export class RestaurantsService {
  private readonly logger = new Logger(RestaurantsService.name);

  constructor(private prisma: PrismaService) {}

  // ============================================
  // RESTAURANT CRUD
  // ============================================

  async create(dto: CreateRestaurantDto, _ownerId: string) {
    // Check if slug is unique
    const existing = await this.prisma.restaurant.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException('Restaurant slug already exists');
    }

    const restaurant = await this.prisma.restaurant.create({
      data: {
        ...dto,
        // Create default policy
        policy: {
          create: {},
        },
      },
      include: {
        policy: true,
      },
    });

    this.logger.log(`Restaurant created: ${restaurant.name} (${restaurant.id})`);

    return restaurant;
  }

  async findAll(filters?: {
    city?: string;
    cuisine?: string;
    priceRange?: number;
    isActive?: boolean;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.city) {
      where.city = filters.city;
    }

    if (filters?.cuisine) {
      where.cuisine = {
        has: filters.cuisine,
      };
    }

    if (filters?.priceRange) {
      where.priceRange = filters.priceRange;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.restaurant.findMany({
      where,
      include: {
        policy: true,
        _count: {
          select: {
            reviews: true,
            reservations: true,
          },
        },
      },
      orderBy: [{ isPremium: 'desc' }, { rating: 'desc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        areas: {
          include: {
            tables: true,
          },
        },
        shifts: {
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
        policy: true,
        experiences: {
          where: {
            isActive: true,
            eventDate: {
              gte: new Date(),
            },
          },
        },
        _count: {
          select: {
            reviews: true,
            reservations: true,
          },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant;
  }

  async findBySlug(slug: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug },
      include: {
        areas: {
          where: { isActive: true },
          include: {
            tables: {
              where: { isActive: true },
            },
          },
        },
        shifts: {
          where: { isActive: true },
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
        policy: true,
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant;
  }

  async update(id: string, dto: UpdateRestaurantDto, userId: string) {
    // Check if restaurant exists and user has access
    await this.verifyRestaurantAccess(id, userId);

    // Check slug uniqueness if being updated
    if (dto.slug) {
      const existing = await this.prisma.restaurant.findFirst({
        where: {
          slug: dto.slug,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException('Restaurant slug already exists');
      }
    }

    const restaurant = await this.prisma.restaurant.update({
      where: { id },
      data: dto,
      include: {
        policy: true,
      },
    });

    this.logger.log(`Restaurant updated: ${restaurant.name} (${id})`);

    return restaurant;
  }

  async delete(id: string, userId: string) {
    await this.verifyRestaurantAccess(id, userId);

    await this.prisma.restaurant.delete({
      where: { id },
    });

    this.logger.log(`Restaurant deleted: ${id}`);

    return { message: 'Restaurant deleted successfully' };
  }

  // ============================================
  // AREAS
  // ============================================

  async createArea(restaurantId: string, dto: CreateAreaDto, userId: string) {
    await this.verifyRestaurantAccess(restaurantId, userId);

    const area = await this.prisma.area.create({
      data: {
        ...dto,
        restaurantId,
      },
    });

    this.logger.log(`Area created: ${area.name} for restaurant ${restaurantId}`);

    return area;
  }

  async getAreas(restaurantId: string) {
    return this.prisma.area.findMany({
      where: { restaurantId },
      include: {
        tables: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });
  }

  async updateArea(areaId: string, dto: Partial<CreateAreaDto>, userId: string) {
    const area = await this.prisma.area.findUnique({
      where: { id: areaId },
      include: { restaurant: true },
    });

    if (!area) {
      throw new NotFoundException('Area not found');
    }

    await this.verifyRestaurantAccess(area.restaurantId, userId);

    return this.prisma.area.update({
      where: { id: areaId },
      data: dto,
    });
  }

  async deleteArea(areaId: string, userId: string) {
    const area = await this.prisma.area.findUnique({
      where: { id: areaId },
    });

    if (!area) {
      throw new NotFoundException('Area not found');
    }

    await this.verifyRestaurantAccess(area.restaurantId, userId);

    await this.prisma.area.delete({
      where: { id: areaId },
    });

    return { message: 'Area deleted successfully' };
  }

  // ============================================
  // TABLES
  // ============================================

  async createTable(restaurantId: string, dto: CreateTableDto, userId: string) {
    await this.verifyRestaurantAccess(restaurantId, userId);

    // Check if table number is unique within restaurant
    const existing = await this.prisma.table.findFirst({
      where: {
        restaurantId,
        number: dto.number,
      },
    });

    if (existing) {
      throw new ConflictException('Table number already exists in this restaurant');
    }

    const table = await this.prisma.table.create({
      data: {
        ...dto,
        restaurantId,
      },
      include: {
        area: true,
      },
    });

    this.logger.log(`Table created: ${table.number} for restaurant ${restaurantId}`);

    return table;
  }

  async getTables(restaurantId: string) {
    return this.prisma.table.findMany({
      where: { restaurantId },
      include: {
        area: true,
      },
      orderBy: {
        number: 'asc',
      },
    });
  }

  async updateTable(tableId: string, dto: Partial<CreateTableDto>, userId: string) {
    const table = await this.prisma.table.findUnique({
      where: { id: tableId },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    await this.verifyRestaurantAccess(table.restaurantId, userId);

    return this.prisma.table.update({
      where: { id: tableId },
      data: dto,
    });
  }

  async deleteTable(tableId: string, userId: string) {
    const table = await this.prisma.table.findUnique({
      where: { id: tableId },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    await this.verifyRestaurantAccess(table.restaurantId, userId);

    await this.prisma.table.delete({
      where: { id: tableId },
    });

    return { message: 'Table deleted successfully' };
  }

  // ============================================
  // SHIFTS
  // ============================================

  async createShift(restaurantId: string, dto: CreateShiftDto, userId: string) {
    await this.verifyRestaurantAccess(restaurantId, userId);

    const shift = await this.prisma.shift.create({
      data: {
        ...dto,
        restaurantId,
      },
    });

    this.logger.log(`Shift created: ${shift.name} for restaurant ${restaurantId}`);

    return shift;
  }

  async getShifts(restaurantId: string, dayOfWeek?: number) {
    const where: any = { restaurantId };

    if (dayOfWeek !== undefined) {
      where.dayOfWeek = dayOfWeek;
    }

    return this.prisma.shift.findMany({
      where,
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async updateShift(shiftId: string, dto: Partial<CreateShiftDto>, userId: string) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
    });

    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    await this.verifyRestaurantAccess(shift.restaurantId, userId);

    return this.prisma.shift.update({
      where: { id: shiftId },
      data: dto,
    });
  }

  async deleteShift(shiftId: string, userId: string) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
    });

    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    await this.verifyRestaurantAccess(shift.restaurantId, userId);

    await this.prisma.shift.delete({
      where: { id: shiftId },
    });

    return { message: 'Shift deleted successfully' };
  }

  // ============================================
  // POLICIES
  // ============================================

  async updatePolicy(restaurantId: string, dto: UpdatePolicyDto, userId: string) {
    await this.verifyRestaurantAccess(restaurantId, userId);

    // Check if policy exists, create if not
    const existing = await this.prisma.restaurantPolicy.findUnique({
      where: { restaurantId },
    });

    if (existing) {
      return this.prisma.restaurantPolicy.update({
        where: { restaurantId },
        data: dto,
      });
    } else {
      return this.prisma.restaurantPolicy.create({
        data: {
          ...dto,
          restaurantId,
        },
      });
    }
  }

  async getPolicy(restaurantId: string) {
    const policy = await this.prisma.restaurantPolicy.findUnique({
      where: { restaurantId },
    });

    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    return policy;
  }

  // ============================================
  // BLOCKS (Closures)
  // ============================================

  async createBlock(restaurantId: string, dto: CreateBlockDto, userId: string) {
    await this.verifyRestaurantAccess(restaurantId, userId);

    const block = await this.prisma.restaurantBlock.create({
      data: {
        ...dto,
        restaurantId,
        createdBy: userId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });

    this.logger.log(
      `Block created for restaurant ${restaurantId}: ${dto.startDate} - ${dto.endDate}`,
    );

    return block;
  }

  async getBlocks(restaurantId: string, startDate?: Date, endDate?: Date) {
    const where: any = { restaurantId };

    if (startDate && endDate) {
      where.AND = [{ startDate: { lte: endDate } }, { endDate: { gte: startDate } }];
    }

    return this.prisma.restaurantBlock.findMany({
      where,
      orderBy: {
        startDate: 'asc',
      },
    });
  }

  async deleteBlock(blockId: string, userId: string) {
    const block = await this.prisma.restaurantBlock.findUnique({
      where: { id: blockId },
    });

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    await this.verifyRestaurantAccess(block.restaurantId, userId);

    await this.prisma.restaurantBlock.delete({
      where: { id: blockId },
    });

    return { message: 'Block deleted successfully' };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async verifyRestaurantAccess(restaurantId: string, userId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        staff: {
          where: { id: userId },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // Check if user is staff member of this restaurant
    // For now, we'll allow any authenticated user (admin check should be added)
    // In production, add proper role-based access control
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || (!restaurant.staff.length && user.role !== 'ADMIN')) {
      throw new ForbiddenException('Access denied to this restaurant');
    }

    return restaurant;
  }
}
