import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { buildApp, cleanDb, uniq, registerUser } from './helpers'
import { PrismaService } from '../src/prisma/prisma.service'

describe('Auth (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService

  beforeAll(async () => {
    app = await buildApp()
    prisma = app.get(PrismaService)
    await cleanDb(prisma)
  })

  afterAll(async () => {
    await cleanDb(prisma)
    await app.close()
  })

  // ── Register ───────────────────────────────────────────────
  describe('POST /auth/register', () => {
    it('registers a new user and returns tokens', async () => {
      const email = uniq()
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, password: 'password123' })
        .expect(201)

      expect(res.body.tokens.accessToken).toBeDefined()
      expect(res.body.tokens.refreshToken).toBeDefined()
    })

    it('rejects duplicate email', async () => {
      const email = uniq()
      await registerUser(app, email)
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, password: 'password123' })
        .expect(400)
    })

    it('rejects short password', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: uniq(), password: 'short' })
        .expect(400)
    })

    it('rejects missing email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ password: 'password123' })
        .expect(400)
    })
  })

  // ── Login ──────────────────────────────────────────────────
  describe('POST /auth/login', () => {
    it('logs in with correct credentials', async () => {
      const email = uniq()
      await registerUser(app, email)

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: 'password123' })
        .expect(201)

      expect(res.body.tokens.accessToken).toBeDefined()
    })

    it('rejects wrong password', async () => {
      const email = uniq()
      await registerUser(app, email)

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: 'wrongpassword' })
        .expect(401)
    })

    it('rejects unknown email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'ghost@nowhere.com', password: 'password123' })
        .expect(401)
    })
  })

  // ── GET /auth/me ──────────────────────────────────────────
  describe('GET /auth/me', () => {
    it('returns user info with valid token', async () => {
      const email = uniq()
      const tokens = await registerUser(app, email)

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .expect(200)

      expect(res.body.email).toBe(email)
      expect(res.body.userId).toBeDefined()
    })

    it('returns 401 without token', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401)
    })

    it('returns 401 with malformed token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer not.a.token')
        .expect(401)
    })
  })

  // ── Refresh token rotation ────────────────────────────────
  describe('POST /auth/refresh', () => {
    it('issues new tokens on valid refresh', async () => {
      const tokens = await registerUser(app, uniq())

      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: tokens.refreshToken })
        .expect(201)

      // refresh returns { accessToken, refreshToken } directly (no tokens wrapper)
      expect(res.body.accessToken).toBeDefined()
      expect(res.body.refreshToken).toBeDefined()
      expect(res.body.refreshToken).not.toBe(tokens.refreshToken)
    })

    it('prevents refresh token replay attack', async () => {
      const tokens = await registerUser(app, uniq())

      // First use — succeeds
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: tokens.refreshToken })
        .expect(201)

      // Second use of same token — must fail (rotation invalidated it)
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: tokens.refreshToken })
        .expect(401)
    })

    it('rejects invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid.token.value' })
        .expect(401)
    })
  })

  // ── Logout ────────────────────────────────────────────────
  describe('POST /auth/logout', () => {
    it('revokes the refresh token on logout', async () => {
      const tokens = await registerUser(app, uniq())

      await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken: tokens.refreshToken })
        .expect(201)

      // Token is now revoked — refresh should fail
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: tokens.refreshToken })
        .expect(401)
    })
  })
})
