import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { BullModule } from '@nestjs/bullmq';
import { LoggerModule } from 'nestjs-pino';
import { join } from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const depthLimit = require('graphql-depth-limit');
import { GraphqlModule } from './graphql/graphql.module';

// Core modules
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';

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

    // Logging - Pino with requestId correlation
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProd = config.get('NODE_ENV') === 'production';
        const logLevel = config.get('LOG_LEVEL') || (isProd ? 'info' : 'debug');

        return {
          pinoHttp: {
            level: logLevel,
            transport: !isProd
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname',
                  },
                }
              : undefined, // JSON stdout in production
            customProps: (req: any) => ({
              requestId: req.requestId,
              userId: req.user?.id,
            }),
            autoLogging: true,
            redact: {
              paths: ['req.headers.authorization', 'req.headers.cookie'],
              remove: true,
            },
          },
        };
      },
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
                context: ({ req, res }: { req: unknown; res: unknown }) => ({ req, res }),
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
                      depthLimit(8),
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

    // GraphQL BFF (conditional)
    ...(process.env.ENABLE_GRAPHQL === 'true' ? [GraphqlModule] : []),

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
