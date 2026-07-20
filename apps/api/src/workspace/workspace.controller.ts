import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { WorkspaceService } from './workspace.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { AddWorkspaceMemberDto } from './dto/add-member.dto';
import { UpdateWorkspaceMemberRoleDto } from './dto/update-member-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceRoleGuard } from '../auth/guards/workspace-role.guard';
import { WorkspaceRoles } from '../auth/decorators/workspace-roles.decorator';
import {
  CurrentUser,
  AuthUser,
} from '../auth/decorators/current-user.decorator';
import { WorkspaceRole } from '../common/enums';

@ApiTags('workspaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a workspace (creator becomes OWNER)' })
  @ApiCreatedResponse({ description: 'Workspace created' })
  @ApiConflictResponse({ description: 'Slug already taken' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateWorkspaceDto) {
    return this.workspaceService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all workspaces the current user belongs to' })
  @ApiOkResponse({ description: 'List of workspaces' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.workspaceService.findAllForUser(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a workspace (members only)' })
  @ApiOkResponse({ description: 'Workspace detail' })
  @ApiForbiddenResponse({ description: 'Not a member' })
  @ApiNotFoundResponse({ description: 'Not found' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.workspaceService.findOne(id, user.id);
  }

  @Patch(':id')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Update workspace (OWNER or ADMIN)' })
  @ApiOkResponse({ description: 'Workspace updated' })
  @ApiForbiddenResponse({ description: 'Insufficient role' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspaceService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(WorkspaceRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete workspace (OWNER only)' })
  @ApiNoContentResponse({ description: 'Workspace deleted' })
  @ApiForbiddenResponse({ description: 'Insufficient role' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.workspaceService.remove(id);
  }

  // ─── Members ───────────────────────────────────────────────────────────────

  @Post(':id/members')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Invite a user to the workspace by email' })
  @ApiCreatedResponse({ description: 'Member added' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiConflictResponse({ description: 'Already a member' })
  addMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddWorkspaceMemberDto,
  ) {
    return this.workspaceService.addMember(id, dto);
  }

  @Patch(':id/members/:userId')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Change a member role (OWNER or ADMIN)' })
  @ApiOkResponse({ description: 'Role updated' })
  updateMemberRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateWorkspaceMemberRoleDto,
  ) {
    return this.workspaceService.updateMemberRole(id, userId, dto);
  }

  @Delete(':id/members/:userId')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from the workspace' })
  @ApiNoContentResponse({ description: 'Member removed' })
  async removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    await this.workspaceService.removeMember(id, userId);
  }
}
