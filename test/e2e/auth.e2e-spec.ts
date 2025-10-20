import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Authentication Flow (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'Test1234!Pass',
    firstName: 'Test',
    lastName: 'User',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body.user.email).toBe(testUser.email);
          accessToken = res.body.accessToken;
        });
    });

    it('should reject duplicate email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(409); // Conflict
    });

    it('should reject weak password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          email: 'another@example.com',
          password: 'weak',
        })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          identifier: testUser.email,
          password: testUser.password,
        })
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body.user.email).toBe(testUser.email);
        });
    });

    it('should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          identifier: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return current user with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.email).toBe(testUser.email);
        });
    });

    it('should reject request without token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.message).toBeDefined();
        });
    });
  });
});

