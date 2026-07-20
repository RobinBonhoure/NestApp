import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

const AUTHOR_SELECT = {
  author: { select: { id: true, name: true, avatarUrl: true } },
};

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(authorId: string, dto: CreateCommentDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: dto.taskId },
    });
    if (!task) throw new NotFoundException('Task not found');

    return this.prisma.comment.create({
      data: { content: dto.content, taskId: dto.taskId, authorId },
      include: AUTHOR_SELECT,
    });
  }

  async findAllForTask(taskId: string) {
    return this.prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
      include: AUTHOR_SELECT,
    });
  }

  async update(id: string, userId: string, dto: UpdateCommentDto) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId)
      throw new ForbiddenException('You can only edit your own comments');

    return this.prisma.comment.update({
      where: { id },
      data: { content: dto.content },
      include: AUTHOR_SELECT,
    });
  }

  async remove(id: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId)
      throw new ForbiddenException('You can only delete your own comments');

    await this.prisma.comment.delete({ where: { id } });
  }
}
