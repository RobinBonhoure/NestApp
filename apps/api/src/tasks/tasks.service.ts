import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { ReorderTasksDto } from './dto/reorder-tasks.dto';
import { AddAssigneeDto } from './dto/add-assignee.dto';
import { AddLabelDto } from './dto/add-label.dto';

const TASK_DETAIL = {
  assignees: {
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  },
  labels: { include: { label: true } },
  comments: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
    },
  },
  subtasks: {
    orderBy: { position: 'asc' as const },
    include: {
      assignees: {
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      },
    },
  },
  reporter: { select: { id: true, name: true, avatarUrl: true } },
};

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(reporterId: string, dto: CreateTaskDto) {
    const column = await this.prisma.column.findUnique({
      where: { id: dto.columnId },
      include: { _count: { select: { tasks: true } } },
    });
    if (!column) throw new NotFoundException('Column not found');

    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority ?? 'NONE',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        parentId: dto.parentId,
        columnId: dto.columnId,
        reporterId,
        position: column._count.tasks,
      },
      include: TASK_DETAIL,
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: TASK_DETAIL,
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async update(id: string, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');

    const { completed, dueDate, ...rest } = dto;
    return this.prisma.task.update({
      where: { id },
      data: {
        ...rest,
        dueDate: dueDate !== undefined ? new Date(dueDate) : undefined,
        completedAt:
          completed === true
            ? new Date()
            : completed === false
              ? null
              : undefined,
      },
      include: TASK_DETAIL,
    });
  }

  async remove(id: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');
    await this.prisma.task.delete({ where: { id } });
  }

  async move(id: string, dto: MoveTaskDto) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');

    await this.prisma.task.update({
      where: { id },
      data: { columnId: dto.columnId, position: dto.position },
    });

    // Reindex remaining tasks in both affected columns to keep positions clean
    await this.reindexColumn(task.columnId);
    if (dto.columnId !== task.columnId) {
      await this.reindexColumn(dto.columnId);
    }

    return this.findOne(id);
  }

  async reorder(columnId: string, dto: ReorderTasksDto) {
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
    });
    if (!column) throw new NotFoundException('Column not found');

    await this.prisma.$transaction(
      dto.taskIds.map((taskId, index) =>
        this.prisma.task.update({
          where: { id: taskId },
          data: { position: index },
        }),
      ),
    );
  }

  // ─── Assignees ─────────────────────────────────────────────────────────────

  async addAssignee(taskId: string, dto: AddAssigneeDto) {
    const existing = await this.prisma.taskAssignee.findUnique({
      where: { taskId_userId: { taskId, userId: dto.userId } },
    });
    if (existing) throw new ConflictException('User is already assigned');

    return this.prisma.taskAssignee.create({
      data: { taskId, userId: dto.userId },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });
  }

  async removeAssignee(taskId: string, userId: string) {
    const existing = await this.prisma.taskAssignee.findUnique({
      where: { taskId_userId: { taskId, userId } },
    });
    if (!existing) throw new NotFoundException('Assignee not found');
    await this.prisma.taskAssignee.delete({
      where: { taskId_userId: { taskId, userId } },
    });
  }

  // ─── Labels ────────────────────────────────────────────────────────────────

  async addLabel(taskId: string, dto: AddLabelDto) {
    const existing = await this.prisma.taskLabel.findUnique({
      where: { taskId_labelId: { taskId, labelId: dto.labelId } },
    });
    if (existing) throw new ConflictException('Label already attached');

    return this.prisma.taskLabel.create({
      data: { taskId, labelId: dto.labelId },
      include: { label: true },
    });
  }

  async removeLabel(taskId: string, labelId: string) {
    const existing = await this.prisma.taskLabel.findUnique({
      where: { taskId_labelId: { taskId, labelId } },
    });
    if (!existing)
      throw new NotFoundException('Label not attached to this task');
    await this.prisma.taskLabel.delete({
      where: { taskId_labelId: { taskId, labelId } },
    });
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private async reindexColumn(columnId: string) {
    const tasks = await this.prisma.task.findMany({
      where: { columnId },
      orderBy: { position: 'asc' },
      select: { id: true },
    });

    await this.prisma.$transaction(
      tasks.map((t, i) =>
        this.prisma.task.update({ where: { id: t.id }, data: { position: i } }),
      ),
    );
  }
}
