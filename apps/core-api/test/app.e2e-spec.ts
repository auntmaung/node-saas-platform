import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { buildApp, cleanDb } from './helpers'
import { PrismaService } from '../src/prisma/prisma.service'

describe('AppController (e2e)', () => {
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

  it('GET /health returns ok', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200)
    expect(res.body.status).toBe('ok')
  })
})
