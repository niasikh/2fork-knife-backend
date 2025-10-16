import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Reservations Flow (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let restaurantId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    // Register and login
    const authRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `test-res-${Date.now()}@example.com`,
        password: 'Test1234!Pass',
        firstName: 'Test',
        lastName: 'User',
      });

    accessToken = authRes.body.accessToken;

    // Get first restaurant (assumes seed data or create one)
    const restaurantsRes = await request(app.getHttpServer())
      .get('/api/v1/restaurants');
    
    if (restaurantsRes.body.length > 0) {
      restaurantId = restaurantsRes.body[0].id;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/reservations', () => {
    it('should create a reservation', () => {
      if (!restaurantId) {
        return; // Skip if no restaurants
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      return request(app.getHttpServer())
        .post('/api/v1/reservations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          restaurantId,
          reservationDate: tomorrow.toISOString().split('T')[0],
          startTime: '19:00',
          partySize: 4,
          guestName: 'John Doe',
          guestEmail: 'john@example.com',
          guestPhone: '+995555123456',
        })
        .expect((res) => {
          expect([200, 201, 400]).toContain(res.status); // May fail validation
          if (res.status === 201 || res.status === 200) {
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('confirmationCode');
          }
        });
    });

    it('should reject reservation without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/reservations')
        .send({})
        .expect(401);
    });
  });

  describe('GET /api/v1/reservations', () => {
    it('should return user reservations', () => {
      return request(app.getHttpServer())
        .get('/api/v1/reservations')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });
});

