import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { TenantsModule } from '../tenants/tenants.module';
import { TenantAccessGuard } from '../tenants/guards/tenant-access.guard';

@Module({
    imports: [TenantsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, TenantAccessGuard],
})
export class ProjectsModule {}
