import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantsService } from './tenants.service';
import { TenantAccessGuard } from './guards/tenant-access.guard';
import { Role } from '@prisma/client';
import { Roles } from '../common/rbac/roles.decorator';
import { RolesGuard } from '../common/rbac/roles.guard';
import { CreateInviteDto } from './invites/dto/create-invite.dto';
import { AcceptInviteDto } from './invites/dto/accept-invite.dto';

@UseGuards(JwtAuthGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Post()
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateTenantDto) {
    return this.tenants.createTenant(user.userId, dto.name, dto.slug.toLowerCase());
  }

  @Get()
  listMine(@CurrentUser() user: CurrentUserPayload) {
    return this.tenants.listMyTenants(user.userId);
  }

  @UseGuards(TenantAccessGuard)
  @Get(':tenantId')
  async getOne(@Param('tenantId') tenantId: string) {
    return this.tenants.getTenantOrThrow(tenantId);
  }

  @UseGuards(TenantAccessGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  @Get(':tenantId/members')
  async members(@Param('tenantId') tenantId: string, @Req() req: any) {
    // Day 4: you can restrict this to ADMIN/OWNER. For now membership-only.
    const rows = await this.tenants.listMembers(tenantId);
    return rows.map((m) => ({
      userId: m.user.id,
      email: m.user.email,
      name: m.user.name,
      role: m.role,
      joinedAt: m.createdAt,
    }));
  }

  @UseGuards(TenantAccessGuard, RolesGuard)
@Roles(Role.ADMIN, Role.OWNER)
@Post(':tenantId/invites')
async invite(
  @Param('tenantId') tenantId: string,
  @CurrentUser() user: CurrentUserPayload,
  @Body() dto: CreateInviteDto,
  @Req() req: any
) {
  const email = dto.email.toLowerCase();
  const role = dto.role ?? Role.MEMBER;
  const reqId = req.headers['x-request-id'];

  const invite = await this.tenants.createInvite(tenantId, user.userId, email, role, reqId);

  return {
    id: invite.id,
    email: invite.email,
    role: invite.role,
    status: invite.status,
    expiresAt: invite.expiresAt,
    token: invite.token, // dev/demo
  };
}

@Post('invites/accept')
async accept(@CurrentUser() user: CurrentUserPayload, @Body() dto: AcceptInviteDto) {
  return this.tenants.acceptInvite(dto.token, user.userId);
}

}
