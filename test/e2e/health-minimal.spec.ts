import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { HealthController } from '../../src/health/health.controller';
import { HealthModule } from '../../src/health/health.module';

describe('Health Endpoints (minimal)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [HealthModule],
    })
      .overrideProvider('PrismaService')
      .useValue({
        $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
      })
      .overrideProvider('ConfigService')
      .useValue({
        get: jest.fn().mockReturnValue('test'),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/health (GET)', () => {
    it('should return 200 OK with status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body.status).toBe('ok');
        });
    });

    it('should include database status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res: any) => {
          expect(res.body.services).toHaveProperty('database');
        });
    });
  });

  describe('/health/ready (GET)', () => {
    it('should return readiness status', () => {
      return request(app.getHttpServer())
        .get('/health/ready')
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('status');
          expect(['ready', 'not_ready']).toContain(res.body.status);
        });
    });
  });

  describe('/health/live (GET)', () => {
    it('should return liveness status', () => {
      return request(app.getHttpServer())
        .get('/health/live')
        .expect(200)
        .expect((res: any) => {
          expect(res.body.status).toBe('alive');
        });
    });
  });
});
