import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TenantsService } from '../tenants.service';

@Injectable()
export class TenantAccessGuard implements CanActivate {
  constructor(private readonly tenants: TenantsService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const user = req.user; // { userId, email } from JwtStrategy
    const tenantId = req.params?.tenantId;

    if (!user?.userId || !tenantId) return false;

    const membership = await this.tenants.requireMembership(user.userId, tenantId);

    // attach membership for later use (RBAC day 4)
    req.membership = membership;
    return true;
  }
}
