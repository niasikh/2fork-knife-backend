import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { BullModule } from '@nestjs/bullmq';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { join } from 'path';

// Core modules
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';

// GraphQL BFF
import { GraphqlModule } from './graphql/graphql.module';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RestaurantsModule } from './modules/restaurants/restaurants.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { ExperiencesModule } from './modules/experiences/experiences.module';
import { GuestsModule } from './modules/guests/guests.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { MenuModule } from './modules/menu/menu.module';
import { WaitlistModule } from './modules/waitlist/waitlist.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Logging
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transports: [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.colorize(),
              winston.format.printf(({ timestamp, level, message, context }) => {
                return `${timestamp} [${context || 'App'}] ${level}: ${message}`;
              }),
            ),
          }),
          ...(config.get('NODE_ENV') === 'production'
            ? [
                new winston.transports.File({
                  filename: 'logs/error.log',
                  level: 'error',
                  format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.json(),
                  ),
                }),
                new winston.transports.File({
                  filename: 'logs/combined.log',
                  format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.json(),
                  ),
                }),
              ]
            : []),
        ],
      }),
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: parseInt(config.get('THROTTLE_TTL') || '60000'),
          limit: parseInt(config.get('THROTTLE_LIMIT') || '100'),
        },
      ],
    }),

    // Task scheduling
    ScheduleModule.forRoot(),

    // Queue (Redis)
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST') || 'localhost',
          port: parseInt(config.get('REDIS_PORT') || '6379'),
          password: config.get('REDIS_PASSWORD'),
          db: parseInt(config.get('REDIS_DB') || '0'),
        },
      }),
    }),

    // GraphQL (BFF for mobile app) - Optional
    ...(process.env.ENABLE_GRAPHQL === 'true'
      ? [
          GraphQLModule.forRootAsync<ApolloDriverConfig>({
            driver: ApolloDriver,
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
              const isProd = config.get('NODE_ENV') === 'production';
              
              return {
                autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
                sortSchema: true,
                playground: !isProd, // Disabled in production
                introspection: !isProd, // Disabled in production
                context: ({ req, res }) => ({ req, res }),
                formatError: (error) => {
                  if (isProd) {
                    // Don't leak error details in production
                    return {
                      message: error.message,
                      code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
                    };
                  }
                  return error;
                },
                // Production hardening
                validationRules: isProd
                  ? [
                      // Limit query depth to prevent deep nested attacks
                      require('graphql-depth-limit')(8),
                    ]
                  : [],
              };
            },
          }),
        ]
      : []),

    // Core
    PrismaModule,
    HealthModule,

    // GraphQL
    GraphqlModule,

    // Features
    AuthModule,
    UsersModule,
    RestaurantsModule,
    ReservationsModule,
    ExperiencesModule,
    GuestsModule,
    PaymentsModule,
    NotificationsModule,
    AnalyticsModule,
    AvailabilityModule,
    ReviewsModule,
    MenuModule,
    WaitlistModule,
    WebhooksModule,
  ],
})
export class AppModule {}

