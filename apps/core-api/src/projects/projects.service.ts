import { BadRequestException  } from '@nestjs/common';
import {Injectable} from '@nestjs/common';
import {NotFoundException} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, userId: string, name: string, description?: string) {
    try {
      return await this.prisma.project.create({
        data: {
          tenantId,
          createdByUserId: userId,
          name,
          description,
        },
        select: {
          id: true, tenantId: true, name: true, description: true, createdAt: true, updatedAt: true,
        },
      });
    } catch (e: any) {
      // Prisma unique constraint -> friendly message
      if (e?.code === 'P2002') throw new BadRequestException('Project name already exists in this tenant');
      throw e;
    }
  }

  async list(tenantId: string, query: { search?: string; page: number; pageSize: number }) {
    const { search, page, pageSize } = query;
    const skip = (page - 1) * pageSize;

    const where: any = { tenantId };
    if (search?.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.project.count({ where }),
      this.prisma.project.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], // deterministic
        skip,
        take: pageSize,
        select: { id: true, tenantId: true, name: true, description: true, createdAt: true, updatedAt: true },
      }),
    ]);

    return {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      items,
    };
  }

  async getOne(tenantId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId }, // critical: tenantId filter prevents leakage
      select: { id: true, tenantId: true, name: true, description: true, createdAt: true, updatedAt: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(tenantId: string, projectId: string, data: { name?: string; description?: string }) {
    // Ensure exists within tenant
    await this.getOne(tenantId, projectId);

    try {
      return await this.prisma.project.updateMany({
        where: { id: projectId, tenantId },
        data,
      }).then(async (r) => {
        if (r.count === 0) throw new NotFoundException('Project not found');
        return this.getOne(tenantId, projectId);
      });
    } catch (e: any) {
      if (e?.code === 'P2002') throw new BadRequestException('Project name already exists in this tenant');
      throw e;
    }
  }

  async remove(tenantId: string, projectId: string) {
    const res = await this.prisma.project.deleteMany({
      where: { id: projectId, tenantId },
    });
    if (res.count === 0) throw new NotFoundException('Project not found');
    return { ok: true };
  }
}
