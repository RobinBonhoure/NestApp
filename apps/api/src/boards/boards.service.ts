import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@Injectable()
export class BoardsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateBoardDto) {
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: dto.projectId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a project member');

    return this.prisma.board.create({
      data: { name: dto.name, projectId: dto.projectId },
    });
  }

  async findAllInProject(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a project member');

    return this.prisma.board.findMany({ where: { projectId } });
  }

  async findOne(id: string, userId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            tasks: {
              orderBy: { position: 'asc' },
              include: {
                assignees: {
                  include: {
                    user: { select: { id: true, name: true, avatarUrl: true } },
                  },
                },
                labels: { include: { label: true } },
                _count: { select: { comments: true, subtasks: true } },
              },
            },
          },
        },
      },
    });

    if (!board) throw new NotFoundException('Board not found');

    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: board.projectId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a project member');

    return board;
  }

  async update(id: string, dto: UpdateBoardDto) {
    const board = await this.prisma.board.findUnique({ where: { id } });
    if (!board) throw new NotFoundException('Board not found');
    return this.prisma.board.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const board = await this.prisma.board.findUnique({ where: { id } });
    if (!board) throw new NotFoundException('Board not found');
    await this.prisma.board.delete({ where: { id } });
  }
}
