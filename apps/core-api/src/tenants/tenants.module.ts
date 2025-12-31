import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { TenantAccessGuard } from './guards/tenant-access.guard';
import { RolesGuard } from '../common/rbac/roles.guard';
import { Reflector } from '@nestjs/core';

@Module({
  controllers: [TenantsController],
  providers: [TenantsService, TenantAccessGuard, RolesGuard, Reflector],
  exports: [TenantsService, TenantAccessGuard],
})
export class TenantsModule {}
