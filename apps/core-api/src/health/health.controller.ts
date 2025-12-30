import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('health/db')
  async db() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', db: 'up' };
  }
}
