import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { ReorderColumnsDto } from './dto/reorder-columns.dto';

@Injectable()
export class ColumnsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateColumnDto) {
    const board = await this.prisma.board.findUnique({
      where: { id: dto.boardId },
      include: { _count: { select: { columns: true } } },
    });
    if (!board) throw new NotFoundException('Board not found');

    return this.prisma.column.create({
      data: {
        name: dto.name,
        boardId: dto.boardId,
        position: board._count.columns,
      },
    });
  }

  async update(id: string, dto: UpdateColumnDto) {
    const column = await this.prisma.column.findUnique({ where: { id } });
    if (!column) throw new NotFoundException('Column not found');
    return this.prisma.column.update({
      where: { id },
      data: { name: dto.name },
    });
  }

  async remove(id: string) {
    const column = await this.prisma.column.findUnique({ where: { id } });
    if (!column) throw new NotFoundException('Column not found');
    await this.prisma.column.delete({ where: { id } });
  }

  async reorder(boardId: string, dto: ReorderColumnsDto) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
    });
    if (!board) throw new NotFoundException('Board not found');

    // Update each column's position to match its index in the provided array.
    // Wrapped in a transaction so positions are updated atomically — no
    // partially-reordered state is ever visible to concurrent readers.
    await this.prisma.$transaction(
      dto.columnIds.map((columnId, index) =>
        this.prisma.column.update({
          where: { id: columnId },
          data: { position: index },
        }),
      ),
    );

    return this.prisma.board.findUnique({
      where: { id: boardId },
      include: { columns: { orderBy: { position: 'asc' } } },
    });
  }
}
