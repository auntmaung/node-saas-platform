import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type AuditEvent = {
  tenantId: string;
  actorUserId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  reqId?: string | null;
  ip?: string | null;
  metadata?: unknown;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async write(evt: AuditEvent) {
    // Never let audit failures break business actions
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId: evt.tenantId,
          actorUserId: evt.actorUserId ?? null,
          action: evt.action,
          resourceType: evt.resourceType,
          resourceId: evt.resourceId ?? null,
          reqId: evt.reqId ?? null,
          ip: evt.ip ?? null,
          metadata: evt.metadata as any,
        },
      });
    } catch {
      // swallow intentionally
    }
  }
}
