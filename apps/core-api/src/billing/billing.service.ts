import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SubscriptionPlan } from '@prisma/client';
import {SubscriptionStatus} from '@prisma/client';

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getOrCreateSubscription(tenantId: string) {
    return this.prisma.subscription.upsert({
      where: { tenantId },
      update: {},
      create: { tenantId, plan: SubscriptionPlan.FREE, status: SubscriptionStatus.ACTIVE },
    });
  }

  async upgrade(tenantId: string, actorUserId: string, plan: SubscriptionPlan, ctx?: { reqId?: string; ip?: string }) {
    if (plan !== SubscriptionPlan.PRO) throw new BadRequestException('Only PRO is supported in this demo');

    const sub = await this.prisma.subscription.upsert({
      where: { tenantId },
      update: { plan: SubscriptionPlan.PRO, status: SubscriptionStatus.ACTIVE },
      create: { tenantId, plan: SubscriptionPlan.PRO, status: SubscriptionStatus.ACTIVE },
    });

    await this.audit.write({
      tenantId,
      actorUserId,
      action: 'SUBSCRIPTION_UPGRADED',
      resourceType: 'SUBSCRIPTION',
      resourceId: sub.id,
      reqId: ctx?.reqId,
      ip: ctx?.ip,
      metadata: { plan: sub.plan, status: sub.status },
    });

    return sub;
  }

  async cancel(tenantId: string, actorUserId: string, ctx?: { reqId?: string; ip?: string }) {
    const sub = await this.getOrCreateSubscription(tenantId);

    const updated = await this.prisma.subscription.update({
      where: { tenantId },
      data: { status: SubscriptionStatus.CANCELED },
    });

    await this.audit.write({
      tenantId,
      actorUserId,
      action: 'SUBSCRIPTION_CANCELED',
      resourceType: 'SUBSCRIPTION',
      resourceId: updated.id,
      reqId: ctx?.reqId,
      ip: ctx?.ip,
      metadata: { plan: updated.plan, status: updated.status },
    });

    return updated;
  }

  // Webhook applies external state changes (simulated Stripe)
  async applyWebhook(provider: string, eventId: string, type: string, payload: any) {
    // Idempotency: store event once
    const existing = await this.prisma.webhookEvent.findUnique({
      where: { provider_eventId: { provider, eventId } },
    });
    if (existing) return { ok: true, deduped: true };

    await this.prisma.webhookEvent.create({
      data: { provider, eventId, type, payload },
    });

    // Example payload shape:
    // data: { tenantId, status: "PAST_DUE" | "ACTIVE" | "CANCELED", currentPeriodEnd? }
    const tenantId: string | undefined = payload?.data?.tenantId;
    if (!tenantId) throw new BadRequestException('Missing tenantId in webhook');

    const status = payload?.data?.status as SubscriptionStatus | undefined;
    if (!status || !(status in SubscriptionStatus)) throw new BadRequestException('Invalid status');

    const currentPeriodEnd = payload?.data?.currentPeriodEnd
      ? new Date(payload.data.currentPeriodEnd)
      : undefined;

    const sub = await this.prisma.subscription.upsert({
      where: { tenantId },
      update: {
        status,
        ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
      },
      create: {
        tenantId,
        plan: SubscriptionPlan.PRO, // assume webhooks are for paid plan
        status,
        ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
      },
    });

    await this.audit.write({
      tenantId,
      actorUserId: null,
      action: 'BILLING_WEBHOOK_APPLIED',
      resourceType: 'SUBSCRIPTION',
      resourceId: sub.id,
      metadata: { provider, eventId, type, status: sub.status, currentPeriodEnd: sub.currentPeriodEnd },
    });

    return { ok: true, applied: true };
  }
}
