import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { buildApp, cleanDb, uniq, registerUser, createTenant } from './helpers'
import { PrismaService } from '../src/prisma/prisma.service'

describe('Projects (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService

  let ownerToken: string
  let adminToken: string
  let memberToken: string
  let tenantId: string

  beforeAll(async () => {
    app = await buildApp()
    prisma = app.get(PrismaService)
    await cleanDb(prisma)

    // Owner creates tenant
    const ownerTokens = await registerUser(app, uniq('owner'))
    ownerToken = ownerTokens.accessToken
    const tenant = await createTenant(app, ownerToken, 'Projects Org')
    tenantId = tenant.id

    // Admin joins
    const adminEmail = uniq('admin')
    const adminTokens = await registerUser(app, adminEmail)
    adminToken = adminTokens.accessToken
    const adminInvite = await request(app.getHttpServer())
      .post(`/tenants/${tenantId}/invites`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: adminEmail, role: 'ADMIN' })
      .then((r) => r.body)
    await request(app.getHttpServer())
      .post('/tenants/invites/accept')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ token: adminInvite.token })

    // Member joins
    const memberEmail = uniq('member')
    const memberTokens = await registerUser(app, memberEmail)
    memberToken = memberTokens.accessToken
    const memberInvite = await request(app.getHttpServer())
      .post(`/tenants/${tenantId}/invites`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: memberEmail, role: 'MEMBER' })
      .then((r) => r.body)
    await request(app.getHttpServer())
      .post('/tenants/invites/accept')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ token: memberInvite.token })
  })

  afterAll(async () => {
    await cleanDb(prisma)
    await app.close()
  })

  // ── Create project ────────────────────────────────────────
  describe('POST /tenants/:tenantId/projects', () => {
    it('OWNER can create a project', async () => {
      const res = await request(app.getHttpServer())
        .post(`/tenants/${tenantId}/projects`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Alpha', description: 'First project' })
        .expect(201)

      expect(res.body.id).toBeDefined()
      expect(res.body.name).toBe('Alpha')
      expect(res.body.tenantId).toBe(tenantId)
    })

    it('ADMIN can create a project', async () => {
      const res = await request(app.getHttpServer())
        .post(`/tenants/${tenantId}/projects`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Beta' })
        .expect(201)

      expect(res.body.name).toBe('Beta')
    })

    it('MEMBER cannot create a project (403)', async () => {
      await request(app.getHttpServer())
        .post(`/tenants/${tenantId}/projects`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ name: 'Gamma' })
        .expect(403)
    })

    it('rejects duplicate project name within tenant', async () => {
      await request(app.getHttpServer())
        .post(`/tenants/${tenantId}/projects`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Duplicate' })
        .expect(201)

      await request(app.getHttpServer())
        .post(`/tenants/${tenantId}/projects`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Duplicate' })
        .expect(400)
    })

    it('outsider cannot create project (403)', async () => {
      const outsider = (await registerUser(app, uniq())).accessToken
      await request(app.getHttpServer())
        .post(`/tenants/${tenantId}/projects`)
        .set('Authorization', `Bearer ${outsider}`)
        .send({ name: 'Hack' })
        .expect(403)
    })
  })

  // ── List projects ─────────────────────────────────────────
  describe('GET /tenants/:tenantId/projects', () => {
    it('MEMBER can list projects', async () => {
      const res = await request(app.getHttpServer())
        .get(`/tenants/${tenantId}/projects`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200)

      expect(Array.isArray(res.body.items)).toBe(true)
      expect(res.body.total).toBeGreaterThanOrEqual(1)
      expect(res.body.page).toBe(1)
    })

    it('supports search filter', async () => {
      await request(app.getHttpServer())
        .post(`/tenants/${tenantId}/projects`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'SearchableProject', description: 'find me' })

      const res = await request(app.getHttpServer())
        .get(`/tenants/${tenantId}/projects?search=Searchable`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200)

      expect(res.body.items.some((p: any) => p.name === 'SearchableProject')).toBe(true)
    })

    it('outsider cannot list projects (403)', async () => {
      const outsider = (await registerUser(app, uniq())).accessToken
      await request(app.getHttpServer())
        .get(`/tenants/${tenantId}/projects`)
        .set('Authorization', `Bearer ${outsider}`)
        .expect(403)
    })
  })

  // ── Get one project ───────────────────────────────────────
  describe('GET /tenants/:tenantId/projects/:projectId', () => {
    it('returns a project by ID', async () => {
      const created = await request(app.getHttpServer())
        .post(`/tenants/${tenantId}/projects`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: `GetOne-${Date.now()}` })
        .then((r) => r.body)

      const res = await request(app.getHttpServer())
        .get(`/tenants/${tenantId}/projects/${created.id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200)

      expect(res.body.id).toBe(created.id)
    })

    it('returns 404 for non-existent project', async () => {
      await request(app.getHttpServer())
        .get(`/tenants/${tenantId}/projects/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(404)
    })
  })

  // ── Update project ────────────────────────────────────────
  describe('PATCH /tenants/:tenantId/projects/:projectId', () => {
    let projectId: string

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post(`/tenants/${tenantId}/projects`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: `UpdateMe-${Date.now()}` })
      projectId = res.body.id
    })

    it('ADMIN can update a project', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/tenants/${tenantId}/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Updated desc' })
        .expect(200)

      expect(res.body.description).toBe('Updated desc')
    })

    it('MEMBER cannot update a project (403)', async () => {
      await request(app.getHttpServer())
        .patch(`/tenants/${tenantId}/projects/${projectId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ description: 'Hacked' })
        .expect(403)
    })
  })

  // ── Delete project ────────────────────────────────────────
  describe('DELETE /tenants/:tenantId/projects/:projectId', () => {
    it('OWNER can delete a project', async () => {
      const created = await request(app.getHttpServer())
        .post(`/tenants/${tenantId}/projects`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: `DeleteMe-${Date.now()}` })
        .then((r) => r.body)

      await request(app.getHttpServer())
        .delete(`/tenants/${tenantId}/projects/${created.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200)

      // Should no longer exist
      await request(app.getHttpServer())
        .get(`/tenants/${tenantId}/projects/${created.id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(404)
    })

    it('MEMBER cannot delete a project (403)', async () => {
      const created = await request(app.getHttpServer())
        .post(`/tenants/${tenantId}/projects`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: `ProtectedProject-${Date.now()}` })
        .then((r) => r.body)

      await request(app.getHttpServer())
        .delete(`/tenants/${tenantId}/projects/${created.id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403)
    })
  })

  // ── Tenant isolation ──────────────────────────────────────
  describe('Tenant isolation', () => {
    it('cannot access projects from another tenant', async () => {
      // Create second tenant with second owner
      const owner2Tokens = await registerUser(app, uniq('owner2'))
      const tenant2 = await createTenant(app, owner2Tokens.accessToken, 'Other Org')

      const project2 = await request(app.getHttpServer())
        .post(`/tenants/${tenant2.id}/projects`)
        .set('Authorization', `Bearer ${owner2Tokens.accessToken}`)
        .send({ name: 'Secret Project' })
        .then((r) => r.body)

      // First owner tries to access second tenant's project — 403
      await request(app.getHttpServer())
        .get(`/tenants/${tenant2.id}/projects/${project2.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(403)
    })
  })
})
