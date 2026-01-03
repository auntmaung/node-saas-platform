import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import {SubscriptionPlan } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { TenantAccessGuard } from '../tenants/guards/tenant-access.guard';
import { RolesGuard } from '../common/rbac/roles.guard';
import { Roles } from '../common/rbac/roles.decorator';
import { BillingService } from './billing.service';
import { UpgradeDto } from './dto/upgrade.dto';

@UseGuards(JwtAuthGuard)
@Controller('tenants/:tenantId/subscription')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @UseGuards(TenantAccessGuard)
  @Get()
  get(@Param('tenantId') tenantId: string) {
    return this.billing.getOrCreateSubscription(tenantId);
  }

  // OWNER only for plan changes
  @UseGuards(TenantAccessGuard, RolesGuard)
  @Roles(Role.OWNER)
  @Post('upgrade')
  upgrade(
    @Param('tenantId') tenantId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpgradeDto,
    @Req() req: any,
  ) {
    return this.billing.upgrade(tenantId, user.userId, dto.plan as SubscriptionPlan, {
      reqId: req.headers['x-request-id'],
      ip: req.ip,
    });
  }

  @UseGuards(TenantAccessGuard, RolesGuard)
  @Roles(Role.OWNER)
  @Post('cancel')
  cancel(
    @Param('tenantId') tenantId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: any,
  ) {
    return this.billing.cancel(tenantId, user.userId, {
      reqId: req.headers['x-request-id'],
      ip: req.ip,
    });
  }
}
