/**
 * E2E shared bootstrap helpers.
 *
 * Each e2e-spec file calls startApp / stopApp in beforeAll / afterAll.
 * Since Jest runs each spec file in its own worker by default, the module-level
 * variables (app, moduleRef) are isolated per file — no cross-suite pollution.
 */

// Load .env.test before AppModule boots so DATABASE_URL and JWT_SECRET are set.
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.test'), override: true });

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';

let app: INestApplication;
let moduleRef: TestingModule;

export async function startApp(): Promise<INestApplication> {
  moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleRef.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  await app.init();

  return app;
}

export async function stopApp(): Promise<void> {
  await app?.close();
}

export function getApp(): INestApplication {
  return app;
}

export function getPrisma(): PrismaService {
  return moduleRef.get(PrismaService);
}

/** Deletes users by email (cascades membership records). */
export async function cleanupEmails(...emails: string[]): Promise<void> {
  if (emails.length === 0) return;
  const prisma = getPrisma();
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
}

/** Deletes a workspace by slug. */
export async function cleanupWorkspaceBySlug(slug: string): Promise<void> {
  const prisma = getPrisma();
  await prisma.workspace.deleteMany({ where: { slug } });
}
