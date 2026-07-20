import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { WORKSPACE_ROLES_KEY } from '../decorators/workspace-roles.decorator';

/**
 * HOW THIS WORKS
 * ──────────────────────────────────────────────────────────────────────────────
 * Guards implement CanActivate. NestJS runs them BEFORE the route handler,
 * after middleware. They return true (allow) or false / throw (deny).
 *
 * The guard pipeline for a protected route looks like:
 *   Middleware → JwtAuthGuard (sets req.user) → WorkspaceRoleGuard → Handler
 *
 * Step by step:
 *
 * 1. Reflector reads the metadata set by @WorkspaceRoles() on the handler or
 *    its controller class. getAllAndOverride checks the method first, then the
 *    class — so method-level metadata wins over class-level.
 *    If no metadata is set, requiredRoles is undefined → guard passes everyone.
 *
 * 2. req.user.id comes from JwtStrategy.validate() — Passport attaches it.
 *    If missing (route misconfigured without JwtAuthGuard), we deny access.
 *
 * 3. workspaceId is read from route params. We try :workspaceId first (nested
 *    routes like /workspaces/:workspaceId/projects), then fall back to :id
 *    (direct routes like /workspaces/:id).
 *
 * 4. We query the WorkspaceMember table for this user+workspace combination.
 *    The @@unique([workspaceId, userId]) constraint in the Prisma schema lets
 *    us use the compound key workspaceId_userId in findUnique — O(1) lookup.
 *
 * 5. If the member exists and their role is in requiredRoles → allow.
 *    Otherwise → deny (returns false → NestJS throws 403 automatically).
 *
 * Why a guard and not just a service check?
 *   Guards run before the handler executes, so no business logic runs on
 *   unauthorized requests. It also keeps authorization declarative (one line
 *   on the controller) instead of imperative (manual check in every service).
 */

@Injectable()
export class WorkspaceRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      WORKSPACE_ROLES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );

    if (!requiredRoles?.length) return true;

    const req = ctx.switchToHttp().getRequest<{
      user?: { id: string };
      params: Record<string, string>;
    }>();

    const userId = req.user?.id;
    if (!userId) return false;

    const workspaceId = req.params.workspaceId ?? req.params.id;
    if (!workspaceId) return false;

    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { role: true },
    });

    return member !== null && requiredRoles.includes(member.role);
  }
}
