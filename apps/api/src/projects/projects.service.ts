import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddProjectMemberDto } from './dto/add-member.dto';
import { UpdateProjectMemberRoleDto } from './dto/update-member-role.dto';

const MEMBER_SELECT = {
  id: true,
  role: true,
  user: { select: { id: true, name: true, email: true, avatarUrl: true } },
};

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateProjectDto) {
    const workspaceMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId: dto.workspaceId, userId },
      },
    });
    if (!workspaceMember)
      throw new ForbiddenException('You are not a member of this workspace');

    const keyConflict = await this.prisma.project.findUnique({
      where: {
        workspaceId_key: { workspaceId: dto.workspaceId, key: dto.key },
      },
    });
    if (keyConflict)
      throw new ConflictException(
        `Key "${dto.key}" is already used in this workspace`,
      );

    return this.prisma.project.create({
      data: {
        name: dto.name,
        key: dto.key.toUpperCase(),
        description: dto.description,
        color: dto.color,
        workspaceId: dto.workspaceId,
        members: { create: { userId, role: 'ADMIN' } },
        boards: {
          create: {
            name: 'Main Board',
            columns: {
              create: [
                { name: 'To Do', position: 0 },
                { name: 'In Progress', position: 1 },
                { name: 'Done', position: 2 },
              ],
            },
          },
        },
      },
      include: { members: { select: MEMBER_SELECT }, boards: true },
    });
  }

  async findAllInWorkspace(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) throw new ForbiddenException();

    return this.prisma.project.findMany({
      where: { workspaceId },
      include: { members: { select: MEMBER_SELECT } },
    });
  }

  async findOne(id: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        members: { select: MEMBER_SELECT },
        boards: true,
        labels: true,
      },
    });
    if (!project) throw new NotFoundException('Project not found');

    const isMember = project.members.some((m) => m.user.id === userId);
    if (!isMember) throw new ForbiddenException();

    return project;
  }

  async update(id: string, dto: UpdateProjectDto) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    return this.prisma.project.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    await this.prisma.project.delete({ where: { id } });
  }

  // ─── Members ───────────────────────────────────────────────────────────────

  async addMember(projectId: string, dto: AddProjectMemberDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
    });
    if (existing)
      throw new ConflictException('User is already a project member');

    return this.prisma.projectMember.create({
      data: { projectId, userId: user.id, role: dto.role ?? 'MEMBER' },
      select: MEMBER_SELECT,
    });
  }

  async updateMemberRole(
    projectId: string,
    targetUserId: string,
    dto: UpdateProjectMemberRoleDto,
  ) {
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: targetUserId } },
    });
    if (!member) throw new NotFoundException('Member not found');

    return this.prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId: targetUserId } },
      data: { role: dto.role },
      select: MEMBER_SELECT,
    });
  }

  async removeMember(projectId: string, targetUserId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: targetUserId } },
    });
    if (!member) throw new NotFoundException('Member not found');
    await this.prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId: targetUserId } },
    });
  }
}
