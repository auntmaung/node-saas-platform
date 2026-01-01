import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { TenantAccessGuard } from '../tenants/guards/tenant-access.guard';
import { Roles } from '../common/rbac/roles.decorator';
import { RolesGuard } from '../common/rbac/roles.guard';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ListProjectsQuery } from './dto/list-projects.query';

@UseGuards(JwtAuthGuard)
@Controller('tenants/:tenantId/projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  // MEMBER+ can read list
  @UseGuards(TenantAccessGuard)
  @Get()
  list(@Param('tenantId') tenantId: string, @Query() query: ListProjectsQuery) {
    return this.projects.list(tenantId, {
      search: query.search,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
    });
  }

  // MEMBER+ can read
  @UseGuards(TenantAccessGuard)
  @Get(':projectId')
  getOne(@Param('tenantId') tenantId: string, @Param('projectId') projectId: string) {
    return this.projects.getOne(tenantId, projectId);
  }

  // ADMIN/OWNER can create
  @UseGuards(TenantAccessGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  @Post()
  create(
    @Param('tenantId') tenantId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projects.create(tenantId, user.userId, dto.name, dto.description);
  }

  // ADMIN/OWNER can update
  @UseGuards(TenantAccessGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  @Patch(':projectId')
  update(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projects.update(tenantId, projectId, dto);
  }

  // ADMIN/OWNER can delete
  @UseGuards(TenantAccessGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  @Delete(':projectId')
  remove(@Param('tenantId') tenantId: string, @Param('projectId') projectId: string) {
    return this.projects.remove(tenantId, projectId);
  }
}
