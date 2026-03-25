import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { PrismaService } from '../src/prisma/prisma.service'

export async function buildApp(): Promise<INestApplication> {
  const module: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile()

  const app = module.createNestApplication()
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  )
  await app.init()
  return app
}

export async function cleanDb(prisma: PrismaService) {
  // Delete in dependency order
  await prisma.auditLog.deleteMany()
  await prisma.webhookEvent.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.project.deleteMany()
  await prisma.invite.deleteMany()
  await prisma.membership.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.tenant.deleteMany()
  await prisma.user.deleteMany()
}

export function uniq(prefix = 'user') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`
}

export async function registerUser(
  app: INestApplication,
  email: string,
  password = 'password123',
) {
  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, password })
    .expect(201)
  return res.body.tokens as { accessToken: string; refreshToken: string }
}

export async function loginUser(
  app: INestApplication,
  email: string,
  password = 'password123',
) {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(201)
  return res.body.tokens as { accessToken: string; refreshToken: string }
}

export async function createTenant(
  app: INestApplication,
  token: string,
  name: string,
) {
  const slug = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
  const res = await request(app.getHttpServer())
    .post('/tenants')
    .set('Authorization', `Bearer ${token}`)
    .send({ name, slug })
    .expect(201)
  return res.body as { id: string; name: string; slug: string }
}
