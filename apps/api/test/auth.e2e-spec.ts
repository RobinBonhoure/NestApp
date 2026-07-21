/**
 * E2E — Auth
 *
 * Utility: these tests prove that the full HTTP stack (ValidationPipe, LocalStrategy,
 * JwtStrategy, AuthController, AuthService) wires together correctly.  Unit tests
 * cannot catch a misconfigured Passport strategy or a missing guard; these can.
 */

import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { startApp, stopApp, getApp, cleanupEmails } from './setup';

// Unique suffix per run so parallel CI runs don't conflict.
const RUN = Date.now();
const EMAIL = `e2e-auth-${RUN}@test.local`;
const PASSWORD = 'StrongPass1!';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await startApp();
  });

  afterAll(async () => {
    await cleanupEmails(EMAIL);
    await stopApp();
  });

  // ─── POST /auth/register ────────────────────────────────────────────────────

  describe('POST /auth/register', () => {
    it('201 — returns an access_token for a new user', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/auth/register')
        .send({ name: 'Test User', email: EMAIL, password: PASSWORD })
        .expect(201);

      expect(res.body).toHaveProperty('access_token');
      expect(typeof res.body.access_token).toBe('string');
    });

    it('409 — rejects a duplicate email', async () => {
      await request(getApp().getHttpServer())
        .post('/auth/register')
        .send({ name: 'Another', email: EMAIL, password: PASSWORD })
        .expect(409);
    });

    it('400 — rejects a missing email field', async () => {
      await request(getApp().getHttpServer())
        .post('/auth/register')
        .send({ name: 'X', password: PASSWORD })
        .expect(400);
    });
  });

  // ─── POST /auth/login ───────────────────────────────────────────────────────

  describe('POST /auth/login', () => {
    it('200 — returns an access_token for correct credentials', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/auth/login')
        .send({ email: EMAIL, password: PASSWORD })
        .expect(200);

      expect(res.body).toHaveProperty('access_token');
    });

    it('401 — rejects a wrong password', async () => {
      await request(getApp().getHttpServer())
        .post('/auth/login')
        .send({ email: EMAIL, password: 'wrong' })
        .expect(401);
    });

    it('401 — rejects an unknown email', async () => {
      await request(getApp().getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@test.local', password: PASSWORD })
        .expect(401);
    });
  });
});
