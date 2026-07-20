import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { AddWorkspaceMemberDto } from './dto/add-member.dto';
import { UpdateWorkspaceMemberRoleDto } from './dto/update-member-role.dto';

const MEMBER_SELECT = {
  id: true,
  role: true,
  joinedAt: true,
  user: { select: { id: true, name: true, email: true, avatarUrl: true } },
};

@Injectable()
export class WorkspaceService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateWorkspaceDto) {
    const slug =
      dto.slug ??
      dto.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

    const existing = await this.prisma.workspace.findUnique({
      where: { slug },
    });
    if (existing)
      throw new ConflictException(`Slug "${slug}" is already taken`);

    return this.prisma.workspace.create({
      data: {
        name: dto.name,
        slug,
        members: { create: { userId, role: 'OWNER' } },
      },
      include: { members: { select: MEMBER_SELECT } },
    });
  }

  findAllForUser(userId: string) {
    return this.prisma.workspace.findMany({
      where: { members: { some: { userId } } },
      include: { members: { select: MEMBER_SELECT } },
    });
  }

  async findOne(id: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
      include: { members: { select: MEMBER_SELECT } },
    });

    if (!workspace) throw new NotFoundException('Workspace not found');

    const isMember = workspace.members.some((m) => m.user.id === userId);
    if (!isMember) throw new ForbiddenException();

    return workspace;
  }

  async update(id: string, dto: UpdateWorkspaceDto) {
    if (dto.slug) {
      const conflict = await this.prisma.workspace.findUnique({
        where: { slug: dto.slug },
      });
      if (conflict && conflict.id !== id)
        throw new ConflictException(`Slug "${dto.slug}" is already taken`);
    }

    return this.prisma.workspace.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const workspace = await this.prisma.workspace.findUnique({ where: { id } });
    if (!workspace) throw new NotFoundException('Workspace not found');
    await this.prisma.workspace.delete({ where: { id } });
  }

  // ─── Members ───────────────────────────────────────────────────────────────

  async addMember(workspaceId: string, dto: AddWorkspaceMemberDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
    });
    if (existing) throw new ConflictException('User is already a member');

    return this.prisma.workspaceMember.create({
      data: { workspaceId, userId: user.id, role: dto.role ?? 'MEMBER' },
      select: MEMBER_SELECT,
    });
  }

  async updateMemberRole(
    workspaceId: string,
    targetUserId: string,
    dto: UpdateWorkspaceMemberRoleDto,
  ) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    });
    if (!member) throw new NotFoundException('Member not found');
    if (member.role === 'OWNER')
      throw new ForbiddenException('Cannot change the OWNER role');

    return this.prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
      data: { role: dto.role },
      select: MEMBER_SELECT,
    });
  }

  async removeMember(workspaceId: string, targetUserId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    });
    if (!member) throw new NotFoundException('Member not found');
    if (member.role === 'OWNER')
      throw new ForbiddenException('Cannot remove the workspace OWNER');

    await this.prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    });
  }
}
