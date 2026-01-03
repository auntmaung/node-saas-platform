import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { ProjectsModule } from './projects/projects.module';
import { QueuesModule } from './queues/queues.module';
import { AuditModule } from './audit/audit.module';
import { AuditController } from './audit/audit.controller';
import { BillingModule } from './billing/billing.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    AuthModule,
    TenantsModule,
    ProjectsModule,
    QueuesModule,
    AuditModule,
    BillingModule,
  ],
  controllers: [AuditController],
})
export class AppModule {}
