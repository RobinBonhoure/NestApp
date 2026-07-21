import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.test'), override: true });

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

/**
 * Smoke E2E test: verifies the application boots and that the global
 * JwtAuthGuard is active — protected routes must return 401, not 404.
 */
describe('App (e2e smoke)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /workspaces without a token → 401', () => {
    return request(app.getHttpServer()).get('/workspaces').expect(401);
  });

  it('POST /auth/login without body → 401', () => {
    return request(app.getHttpServer()).post('/auth/login').send({}).expect(401);
  });
});
