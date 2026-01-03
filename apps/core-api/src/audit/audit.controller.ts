import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantAccessGuard } from '../tenants/guards/tenant-access.guard';
import { RolesGuard } from '../common/rbac/roles.guard';
import { Roles } from '../common/rbac/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('tenants/:tenantId/audit-logs')
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @UseGuards(TenantAccessGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  @Get()
  async list(
    @Param('tenantId') tenantId: string,
    @Query('page') pageStr?: string,
    @Query('pageSize') pageSizeStr?: string,
  ) {
    const page = Math.max(1, Number(pageStr ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(pageSizeStr ?? 20)));
    const skip = (page - 1) * pageSize;

    const [total, items] = await this.prisma.$transaction([
      this.prisma.auditLog.count({ where: { tenantId } }),
      this.prisma.auditLog.findMany({
        where: { tenantId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: pageSize,
        select: {
          id: true,
          createdAt: true,
          actorUserId: true,
          action: true,
          resourceType: true,
          resourceId: true,
          reqId: true,
          ip: true,
          metadata: true,
        },
      }),
    ]);

    return {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      items,
    };
  }
}
