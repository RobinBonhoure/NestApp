import { SetMetadata } from '@nestjs/common';
import { WorkspaceRole } from '../../common/enums';

/**
 * HOW THIS WORKS
 * ──────────────────────────────────────────────────────────────────────────────
 * @WorkspaceRoles('OWNER', 'ADMIN') is a metadata decorator.
 * SetMetadata(key, value) stores the value on the route handler (or controller
 * class) under a known key. The WorkspaceRoleGuard then reads this metadata
 * using Reflector to know which roles are required for that specific endpoint.
 *
 * Usage:
 *   @WorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
 *   @UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
 *   @Delete(':id')
 *   delete(...) {}
 *
 * If @WorkspaceRoles is not present on a route, WorkspaceRoleGuard lets
 * any authenticated user through (the guard only enforces when metadata exists).
 */

export const WORKSPACE_ROLES_KEY = 'workspace_roles';

export const WorkspaceRoles = (...roles: WorkspaceRole[]) =>
  SetMetadata(WORKSPACE_ROLES_KEY, roles);
