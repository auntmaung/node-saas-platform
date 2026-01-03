import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { WebhookController } from './webhook.controller';
import { TenantsModule } from '../tenants/tenants.module';
import { TenantAccessGuard } from '../tenants/guards/tenant-access.guard';

@Module({
    imports: [TenantsModule],
  providers: [BillingService,TenantAccessGuard],
  controllers: [BillingController, WebhookController],
  
})
export class BillingModule {}
