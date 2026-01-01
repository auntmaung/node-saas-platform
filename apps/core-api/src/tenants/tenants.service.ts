import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { InviteStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { QueuesService } from '../queues/queues.service';
import { createHash } from 'crypto';
@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
  private readonly queues: QueuesService,) {}

  async createTenant(userId: string, name: string, slug: string) {
    // Ensure slug unique
    const existing = await this.prisma.tenant.findUnique({ where: { slug } });
    if (existing) throw new BadRequestException('Slug already in use');

    // Transaction: create tenant + membership OWNER
    const tenant = await this.prisma.$transaction(async (tx) => {
      const t = await tx.tenant.create({ data: { name, slug } });
      await tx.membership.create({
        data: { tenantId: t.id, userId, role: Role.OWNER },
      });
      return t;
    });

    return tenant;
  }

  async listMyTenants(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      include: { tenant: true },
      orderBy: { createdAt: 'desc' },
    });

    return memberships.map((m) => ({
      tenantId: m.tenant.id,
      name: m.tenant.name,
      slug: m.tenant.slug,
      status: m.tenant.status,
      role: m.role,
      joinedAt: m.createdAt,
    }));
  }

  async getTenantOrThrow(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async requireMembership(userId: string, tenantId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
    });
    if (!membership) throw new ForbiddenException('No access to tenant');
    return membership;
  }

  async listMembers(tenantId: string) {
    return this.prisma.membership.findMany({
      where: { tenantId },
      include: { user: { select: { id: true, email: true, name: true } } },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });
  }
private inviteExpiryDate(days = 7) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async createInvite(tenantId: string, createdByUserId: string, email: string, role: Role,reqId?: string,) {
  // If user already a member, don’t invite
  const existingMember = await this.prisma.membership.findUnique({
    where: { tenantId_userId: { tenantId, userId: createdByUserId } },
  });
  if (!existingMember) throw new ForbiddenException('No access to tenant');

  // If target already a member (by email), block
  const targetUser = await this.prisma.user.findUnique({ where: { email } });
  if (targetUser) {
    const targetMembership = await this.prisma.membership.findUnique({
      where: { tenantId_userId: { tenantId, userId: targetUser.id } },
    });
    if (targetMembership) throw new BadRequestException('User already a member');
  }
 const token = randomUUID() + randomUUID(); 
  const existingInvite = await this.prisma.invite.findFirst({
    where: { tenantId, email, status: InviteStatus.PENDING },
  });
  // Idempotency: reuse existing pending invite for tenant+email
  const invite = existingInvite ?? await this.prisma.invite.create({
  data: {
    tenantId,
    createdByUserId,
    email,
    role,
    token,
    expiresAt: this.inviteExpiryDate(7),
  },
});
const key = `${tenantId}|${email.toLowerCase()}`; // any delimiter except ':'
const jobId = createHash('sha256').update(key).digest('hex');

 

// Enqueue email job (idempotent via jobId)
await this.queues.queueNotifications().add(
  'invite.email',
  {
    reqId,
    inviteId: invite.id,
    tenantId: invite.tenantId,
    email: invite.email,
    role: invite.role,
    token: invite.token, // demo: in real life you'd send a URL
    expiresAt: invite.expiresAt.toISOString(),
  },
  {
    jobId: `invite-email-${jobId}`,
  },
);

return invite;

}

async acceptInvite(token: string, userId: string) {
  const invite = await this.prisma.invite.findUnique({ where: { token } });
  if (!invite) throw new NotFoundException('Invite not found');

  if (invite.status !== InviteStatus.PENDING) {
    throw new BadRequestException('Invite is not pending');
  }

  if (invite.expiresAt.getTime() < Date.now()) {
    await this.prisma.invite.update({
      where: { token },
      data: { status: InviteStatus.EXPIRED },
    });
    throw new BadRequestException('Invite expired');
  }

  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundException('User not found');

  if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
    // prevents accepting someone else’s invite
    throw new ForbiddenException('Invite email mismatch');
  }

  // Transaction: create membership if not exists + mark accepted
  await this.prisma.$transaction(async (tx) => {
    await tx.membership.upsert({
      where: { tenantId_userId: { tenantId: invite.tenantId, userId } },
      update: { role: invite.role },
      create: { tenantId: invite.tenantId, userId, role: invite.role },
    });

    await tx.invite.update({
      where: { token },
      data: { status: InviteStatus.ACCEPTED, acceptedAt: new Date() },
    });
  });

  return { ok: true, tenantId: invite.tenantId };
}


}
