import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';

@Injectable()
export class LabelsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateLabelDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });
    if (!project) throw new NotFoundException('Project not found');

    const existing = await this.prisma.label.findUnique({
      where: { projectId_name: { projectId: dto.projectId, name: dto.name } },
    });
    if (existing)
      throw new ConflictException(
        `Label "${dto.name}" already exists in this project`,
      );

    return this.prisma.label.create({
      data: { name: dto.name, color: dto.color, projectId: dto.projectId },
    });
  }

  findAllInProject(projectId: string) {
    return this.prisma.label.findMany({ where: { projectId } });
  }

  async update(id: string, dto: UpdateLabelDto) {
    const label = await this.prisma.label.findUnique({ where: { id } });
    if (!label) throw new NotFoundException('Label not found');

    if (dto.name && dto.name !== label.name) {
      const conflict = await this.prisma.label.findUnique({
        where: {
          projectId_name: { projectId: label.projectId, name: dto.name },
        },
      });
      if (conflict)
        throw new ConflictException(
          `Label "${dto.name}" already exists in this project`,
        );
    }

    return this.prisma.label.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const label = await this.prisma.label.findUnique({ where: { id } });
    if (!label) throw new NotFoundException('Label not found');
    await this.prisma.label.delete({ where: { id } });
  }
}
