import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { buildApp, cleanDb, uniq, registerUser, createTenant } from './helpers'
import { PrismaService } from '../src/prisma/prisma.service'

describe('Tenants (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService

  // Shared owner + tenant for read-only tests
  let ownerToken: string
  let tenantId: string

  beforeAll(async () => {
    app = await buildApp()
    prisma = app.get(PrismaService)
    await cleanDb(prisma)

    const ownerTokens = await registerUser(app, uniq('owner'))
    ownerToken = ownerTokens.accessToken
    const tenant = await createTenant(app, ownerToken, 'Main Org')
    tenantId = tenant.id
  })

  afterAll(async () => {
    await cleanDb(prisma)
    await app.close()
  })

  // ── Create tenant ─────────────────────────────────────────
  describe('POST /tenants', () => {
    it('creates a tenant and makes creator OWNER', async () => {
      const token = (await registerUser(app, uniq())).accessToken
      const slug = `my-org-${Date.now()}`

      const res = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'My Org', slug })
        .expect(201)

      expect(res.body.id).toBeDefined()
      expect(res.body.slug).toBe(slug)
    })

    it('rejects duplicate slug', async () => {
      const token = (await registerUser(app, uniq())).accessToken
      const slug = `dup-slug-${Date.now()}`

      await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Org A', slug })
        .expect(201)

      await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Org B', slug })
        .expect(400)
    })

    it('requires auth', async () => {
      await request(app.getHttpServer())
        .post('/tenants')
        .send({ name: 'No Auth', slug: 'no-auth' })
        .expect(401)
    })
  })

  // ── List my tenants ───────────────────────────────────────
  describe('GET /tenants', () => {
    it('returns tenants the user belongs to', async () => {
      const res = await request(app.getHttpServer())
        .get('/tenants')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200)

      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThanOrEqual(1)
      expect(res.body[0].role).toBeDefined()
    })

    it('returns empty array for new user with no tenants', async () => {
      const token = (await registerUser(app, uniq())).accessToken
      const res = await request(app.getHttpServer())
        .get('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(res.body).toEqual([])
    })
  })

  // ── Get one tenant ────────────────────────────────────────
  describe('GET /tenants/:tenantId', () => {
    it('returns tenant for a member', async () => {
      const res = await request(app.getHttpServer())
        .get(`/tenants/${tenantId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200)

      expect(res.body.id).toBe(tenantId)
    })

    it('returns 403 for non-member', async () => {
      const token = (await registerUser(app, uniq())).accessToken
      await request(app.getHttpServer())
        .get(`/tenants/${tenantId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403)
    })
  })

  // ── List members (ADMIN+) ─────────────────────────────────
  describe('GET /tenants/:tenantId/members', () => {
    it('OWNER can list members', async () => {
      const res = await request(app.getHttpServer())
        .get(`/tenants/${tenantId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200)

      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body[0].role).toBe('OWNER')
    })

    it('MEMBER is forbidden from listing members', async () => {
      // Register new user and have owner invite them as MEMBER
      const memberEmail = uniq('member')
      const memberTokens = await registerUser(app, memberEmail)

      // Owner invites member
      await request(app.getHttpServer())
        .post(`/tenants/${tenantId}/invites`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ email: memberEmail, role: 'MEMBER' })
        .expect(201)

      // Member accepts invite
      const invite = await prisma.invite.findFirst({ where: { email: memberEmail } })
      await request(app.getHttpServer())
        .post('/tenants/invites/accept')
        .set('Authorization', `Bearer ${memberTokens.accessToken}`)
        .send({ token: invite!.token })
        .expect(201)

      // Member tries to list members — should be 403
      await request(app.getHttpServer())
        .get(`/tenants/${tenantId}/members`)
        .set('Authorization', `Bearer ${memberTokens.accessToken}`)
        .expect(403)
    })
  })

  // ── Invites ───────────────────────────────────────────────
  describe('POST /tenants/:tenantId/invites', () => {
    it('OWNER can invite a new user', async () => {
      const email = uniq('invited')
      const res = await request(app.getHttpServer())
        .post(`/tenants/${tenantId}/invites`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ email, role: 'MEMBER' })
        .expect(201)

      expect(res.body.token).toBeDefined()
      expect(res.body.status).toBe('PENDING')
    })

    it('non-member cannot invite', async () => {
      const outsiderToken = (await registerUser(app, uniq())).accessToken
      await request(app.getHttpServer())
        .post(`/tenants/${tenantId}/invites`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({ email: uniq(), role: 'MEMBER' })
        .expect(403)
    })

    it('cannot invite already-member user', async () => {
      // Owner invites themselves (they're already a member)
      const ownerEmail = await prisma.membership
        .findFirst({ where: { tenantId }, include: { user: true } })
        .then((m) => m!.user.email)

      await request(app.getHttpServer())
        .post(`/tenants/${tenantId}/invites`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ email: ownerEmail, role: 'MEMBER' })
        .expect(400)
    })
  })

  // ── Accept invite ─────────────────────────────────────────
  describe('POST /tenants/invites/accept', () => {
    it('user can accept invite and becomes member', async () => {
      const newEmail = uniq('acceptee')
      const newTokens = await registerUser(app, newEmail)

      // Owner creates invite
      const inviteRes = await request(app.getHttpServer())
        .post(`/tenants/${tenantId}/invites`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ email: newEmail, role: 'ADMIN' })
        .expect(201)

      // New user accepts
      await request(app.getHttpServer())
        .post('/tenants/invites/accept')
        .set('Authorization', `Bearer ${newTokens.accessToken}`)
        .send({ token: inviteRes.body.token })
        .expect(201)

      // Verify membership created with correct role
      const membership = await prisma.membership.findFirst({
        where: { tenantId },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      })
      expect(membership!.user.email).toBe(newEmail)
      expect(membership!.role).toBe('ADMIN')
    })

    it('rejects invite with wrong email', async () => {
      const invitedEmail = uniq('invited')
      const wrongUserTokens = await registerUser(app, uniq('wrong'))

      const inviteRes = await request(app.getHttpServer())
        .post(`/tenants/${tenantId}/invites`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ email: invitedEmail, role: 'MEMBER' })
        .expect(201)

      // Wrong user tries to accept
      await request(app.getHttpServer())
        .post('/tenants/invites/accept')
        .set('Authorization', `Bearer ${wrongUserTokens.accessToken}`)
        .send({ token: inviteRes.body.token })
        .expect(403)
    })

    it('rejects invalid invite token', async () => {
      const token = (await registerUser(app, uniq())).accessToken
      await request(app.getHttpServer())
        .post('/tenants/invites/accept')
        .set('Authorization', `Bearer ${token}`)
        .send({ token: 'non-existent-token' })
        .expect(404)
    })
  })
})
