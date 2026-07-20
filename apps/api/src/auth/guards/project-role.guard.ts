import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { PROJECT_ROLES_KEY } from '../decorators/project-roles.decorator';

/**
 * Same pattern as WorkspaceRoleGuard but checks ProjectMember.role instead.
 * Reads :projectId from params first (nested routes), then falls back to :id.
 */
@Injectable()
export class ProjectRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      PROJECT_ROLES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );

    if (!requiredRoles?.length) return true;

    const req = ctx.switchToHttp().getRequest<{
      user?: { id: string };
      params: Record<string, string>;
    }>();

    const userId = req.user?.id;
    if (!userId) return false;

    const projectId = req.params.projectId ?? req.params.id;
    if (!projectId) return false;

    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { role: true },
    });

    return member !== null && requiredRoles.includes(member.role);
  }
}
