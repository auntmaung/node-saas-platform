import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';

const rank: Record<Role, number> = {
  OWNER: 3,
  ADMIN: 2,
  MEMBER: 1,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no @Roles specified, allow
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const membership = req.membership as { role?: Role } | undefined;

    // RolesGuard is for tenant-scoped routes: requires TenantAccessGuard ran first
    if (!membership?.role) return false;

    // Allow if membership role is >= any required role (OWNER satisfies ADMIN, etc.)
    const userRank = rank[membership.role];
    const minRank = Math.min(...required.map((r) => rank[r]));

    return userRank >= minRank;
  }
}
