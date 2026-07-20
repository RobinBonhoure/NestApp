import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * HOW THIS WORKS
 * ──────────────────────────────────────────────────────────────────────────────
 * When a request hits a JWT-protected route, the JwtAuthGuard runs first.
 * It validates the Bearer token and calls JwtStrategy.validate(), which returns:
 *   { id: payload.sub, email: payload.email }
 *
 * Passport then attaches that return value to req.user automatically.
 *
 * Without this decorator, every controller method that needs the current user
 * has to do:
 *   @Request() req: { user: { id: string; email: string } }
 *   const userId = req.user.id;
 *
 * createParamDecorator creates a custom parameter decorator. Its factory
 * function receives:
 *   - data: whatever you pass to the decorator call, e.g. @CurrentUser('id') → 'id'
 *   - ctx: the ExecutionContext — an abstraction over HTTP / WS / gRPC contexts
 *
 * ctx.switchToHttp() narrows the context to HTTP specifically, then
 * .getRequest() returns the raw Express Request object. We grab .user off it.
 *
 * With this decorator controllers become:
 *   @CurrentUser() user: AuthUser
 *   const userId = user.id;
 */

export type AuthUser = { id: string; email: string };

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const req = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    return req.user;
  },
);
