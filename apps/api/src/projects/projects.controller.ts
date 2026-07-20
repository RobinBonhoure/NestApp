import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddProjectMemberDto } from './dto/add-member.dto';
import { UpdateProjectMemberRoleDto } from './dto/update-member-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectRoleGuard } from '../auth/guards/project-role.guard';
import { ProjectRoles } from '../auth/decorators/project-roles.decorator';
import {
  CurrentUser,
  AuthUser,
} from '../auth/decorators/current-user.decorator';
import { ProjectRole } from '../common/enums';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a project inside a workspace' })
  @ApiCreatedResponse({ description: 'Project created with default board' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List projects in a workspace' })
  @ApiQuery({ name: 'workspaceId', type: String })
  @ApiOkResponse({ description: 'List of projects' })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('workspaceId', ParseUUIDPipe) workspaceId: string,
  ) {
    return this.projectsService.findAllInWorkspace(workspaceId, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project (members only)' })
  @ApiOkResponse({ description: 'Project detail' })
  @ApiNotFoundResponse({ description: 'Not found' })
  @ApiForbiddenResponse({ description: 'Not a member' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.projectsService.findOne(id, user.id);
  }

  @Patch(':id')
  @UseGuards(ProjectRoleGuard)
  @ProjectRoles(ProjectRole.ADMIN)
  @ApiOperation({ summary: 'Update a project (ADMIN only)' })
  @ApiOkResponse({ description: 'Project updated' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(ProjectRoleGuard)
  @ProjectRoles(ProjectRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a project (ADMIN only)' })
  @ApiNoContentResponse({ description: 'Project deleted' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.projectsService.remove(id);
  }

  // ─── Members ───────────────────────────────────────────────────────────────

  @Post(':id/members')
  @UseGuards(ProjectRoleGuard)
  @ProjectRoles(ProjectRole.ADMIN)
  @ApiOperation({ summary: 'Add a member to the project (ADMIN only)' })
  @ApiCreatedResponse({ description: 'Member added' })
  addMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddProjectMemberDto,
  ) {
    return this.projectsService.addMember(id, dto);
  }

  @Patch(':id/members/:userId')
  @UseGuards(ProjectRoleGuard)
  @ProjectRoles(ProjectRole.ADMIN)
  @ApiOperation({ summary: 'Change a member role (ADMIN only)' })
  @ApiOkResponse({ description: 'Role updated' })
  updateMemberRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateProjectMemberRoleDto,
  ) {
    return this.projectsService.updateMemberRole(id, userId, dto);
  }

  @Delete(':id/members/:userId')
  @UseGuards(ProjectRoleGuard)
  @ProjectRoles(ProjectRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from the project (ADMIN only)' })
  @ApiNoContentResponse({ description: 'Member removed' })
  async removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    await this.projectsService.removeMember(id, userId);
  }
}
