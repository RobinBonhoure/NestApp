/**
 * E2E — Workspaces
 *
 * Utility: these tests verify that JWT guards, the WorkspaceRoleGuard, UUID
 * validation pipes, and member-management endpoints all integrate correctly.
 * Unit tests mock Prisma and cannot catch misrouted requests, missing guards,
 * or broken UUID pipes.
 */

import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { startApp, stopApp, getApp, cleanupEmails, cleanupWorkspaceBySlug } from './setup';

const RUN = Date.now();
const OWNER_EMAIL = `e2e-ws-owner-${RUN}@test.local`;
const MEMBER_EMAIL = `e2e-ws-member-${RUN}@test.local`;
const PASSWORD = 'StrongPass1!';

let ownerToken: string;
let memberToken: string;
let workspaceId: string;
const workspaceSlug = `e2e-ws-${RUN}`;

describe('Workspaces (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await startApp();

    // Register owner and capture token.
    const ownerRes = await request(getApp().getHttpServer())
      .post('/auth/register')
      .send({ name: 'Owner', email: OWNER_EMAIL, password: PASSWORD });
    ownerToken = ownerRes.body.access_token;

    // Register a second user (for invite tests).
    const memberRes = await request(getApp().getHttpServer())
      .post('/auth/register')
      .send({ name: 'Member', email: MEMBER_EMAIL, password: PASSWORD });
    memberToken = memberRes.body.access_token;
  });

  afterAll(async () => {
    await cleanupEmails(OWNER_EMAIL, MEMBER_EMAIL);
    await stopApp();
  });

  // ─── Unauthenticated requests ───────────────────────────────────────────────

  it('GET /workspaces → 401 without a token', async () => {
    await request(getApp().getHttpServer()).get('/workspaces').expect(401);
  });

  it('POST /workspaces → 401 without a token', async () => {
    await request(getApp().getHttpServer())
      .post('/workspaces')
      .send({ name: 'X' })
      .expect(401);
  });

  // ─── POST /workspaces ───────────────────────────────────────────────────────

  describe('POST /workspaces', () => {
    it('201 — creates a workspace and returns it with the owner as member', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/workspaces')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'E2E Workspace', slug: workspaceSlug })
        .expect(201);

      expect(res.body).toMatchObject({ name: 'E2E Workspace', slug: workspaceSlug });
      expect(Array.isArray(res.body.members)).toBe(true);
      expect(res.body.members[0].role).toBe('OWNER');

      workspaceId = res.body.id;
    });

    it('409 — rejects a duplicate slug', async () => {
      await request(getApp().getHttpServer())
        .post('/workspaces')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Duplicate', slug: workspaceSlug })
        .expect(409);
    });
  });

  // ─── GET /workspaces ────────────────────────────────────────────────────────

  describe('GET /workspaces', () => {
    it('200 — returns only workspaces the current user belongs to', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/workspaces')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const found = res.body.find((ws: { slug: string }) => ws.slug === workspaceSlug);
      expect(found).toBeDefined();
    });

    it('200 — does not include workspaces the user is not a member of', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/workspaces')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      const found = res.body.find((ws: { slug: string }) => ws.slug === workspaceSlug);
      expect(found).toBeUndefined();
    });
  });

  // ─── GET /workspaces/:id ────────────────────────────────────────────────────

  describe('GET /workspaces/:id', () => {
    it('200 — returns the workspace for a member', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.id).toBe(workspaceId);
    });

    it('403 — returns 403 for a non-member', async () => {
      await request(getApp().getHttpServer())
        .get(`/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);
    });

    it('404 — returns 404 for a non-existent id', async () => {
      await request(getApp().getHttpServer())
        .get('/workspaces/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(404);
    });
  });

  // ─── PATCH /workspaces/:id ──────────────────────────────────────────────────

  describe('PATCH /workspaces/:id', () => {
    it('200 — OWNER can rename the workspace', async () => {
      const res = await request(getApp().getHttpServer())
        .patch(`/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Renamed Workspace' })
        .expect(200);

      expect(res.body.name).toBe('Renamed Workspace');
    });

    it('403 — a non-member cannot update the workspace', async () => {
      await request(getApp().getHttpServer())
        .patch(`/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ name: 'Hijack' })
        .expect(403);
    });
  });

  // ─── POST /workspaces/:id/members ───────────────────────────────────────────

  describe('POST /workspaces/:id/members', () => {
    it('201 — OWNER can invite a user by email', async () => {
      const res = await request(getApp().getHttpServer())
        .post(`/workspaces/${workspaceId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ email: MEMBER_EMAIL, role: 'MEMBER' })
        .expect(201);

      expect(res.body.role).toBe('MEMBER');
      expect(res.body.user.email).toBe(MEMBER_EMAIL);
    });

    it('409 — inviting the same user twice returns 409', async () => {
      await request(getApp().getHttpServer())
        .post(`/workspaces/${workspaceId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ email: MEMBER_EMAIL, role: 'MEMBER' })
        .expect(409);
    });

    it('404 — inviting an unknown email returns 404', async () => {
      await request(getApp().getHttpServer())
        .post(`/workspaces/${workspaceId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ email: `ghost-${RUN}@test.local`, role: 'MEMBER' })
        .expect(404);
    });
  });
});
