import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectRole } from '../common/enums';

const mockPrisma = {
  workspaceMember: {
    findUnique: jest.fn(),
  },
  project: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  projectMember: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

describe('ProjectsService', () => {
  let service: ProjectsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto = { name: 'My Project', key: 'mypr', workspaceId: 'ws-1' };

    it('creates the project when the user is a workspace member', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({ id: 'mem-1' });
      mockPrisma.project.findUnique.mockResolvedValue(null);
      const created = {
        id: 'proj-1',
        name: 'My Project',
        key: 'MYPR',
        members: [],
        boards: [],
      };
      mockPrisma.project.create.mockResolvedValue(created);

      const result = await service.create('user-1', dto);

      expect(result).toEqual(created);
      expect(mockPrisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'My Project',
            key: 'MYPR',
            workspaceId: 'ws-1',
          }),
        }),
      );
    });

    it('uppercases the key before persisting', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({ id: 'mem-1' });
      mockPrisma.project.findUnique.mockResolvedValue(null);
      mockPrisma.project.create.mockResolvedValue({ id: 'p', key: 'MYPR' });

      await service.create('user-1', { ...dto, key: 'mypr' });

      expect(mockPrisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ key: 'MYPR' }),
        }),
      );
    });

    it('throws ForbiddenException when the user is not a workspace member', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(service.create('user-1', dto)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockPrisma.project.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the key is already used in the workspace', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({ id: 'mem-1' });
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'existing-proj' });

      await expect(service.create('user-1', dto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockPrisma.project.create).not.toHaveBeenCalled();
    });
  });

  // ─── findAllInWorkspace ───────────────────────────────────────────────────────

  describe('findAllInWorkspace', () => {
    it('returns projects for a workspace member', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({ id: 'mem-1' });
      const projects = [{ id: 'proj-1' }, { id: 'proj-2' }];
      mockPrisma.project.findMany.mockResolvedValue(projects);

      const result = await service.findAllInWorkspace('ws-1', 'user-1');

      expect(result).toEqual(projects);
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { workspaceId: 'ws-1' } }),
      );
    });

    it('throws ForbiddenException when the user is not a workspace member', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(
        service.findAllInWorkspace('ws-1', 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the project when the user is a project member', async () => {
      const project = { id: 'proj-1', members: [{ user: { id: 'user-1' } }] };
      mockPrisma.project.findUnique.mockResolvedValue(project);

      const result = await service.findOne('proj-1', 'user-1');

      expect(result).toEqual(project);
    });

    it('throws NotFoundException when the project does not exist', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(service.findOne('ghost', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when the user is not a project member', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        members: [{ user: { id: 'other-user' } }],
      });

      await expect(service.findOne('proj-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates and returns the project', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'proj-1' });
      const updated = { id: 'proj-1', name: 'Renamed' };
      mockPrisma.project.update.mockResolvedValue(updated);

      const result = await service.update('proj-1', { name: 'Renamed' });

      expect(result).toEqual(updated);
    });

    it('throws NotFoundException when the project does not exist', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(service.update('ghost', { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── remove ──────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('deletes the project', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'proj-1' });

      await service.remove('proj-1');

      expect(mockPrisma.project.delete).toHaveBeenCalledWith({
        where: { id: 'proj-1' },
      });
    });

    it('throws NotFoundException when the project does not exist', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(service.remove('ghost')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── addMember ───────────────────────────────────────────────────────────────

  describe('addMember', () => {
    it('creates a membership record for an existing user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-2',
        email: 'b@b.com',
      });
      mockPrisma.projectMember.findUnique.mockResolvedValue(null);
      const member = {
        id: 'pm-1',
        role: ProjectRole.MEMBER,
        user: { id: 'user-2' },
      };
      mockPrisma.projectMember.create.mockResolvedValue(member);

      const result = await service.addMember('proj-1', {
        email: 'b@b.com',
        role: ProjectRole.MEMBER,
      });

      expect(result).toEqual(member);
    });

    it('throws NotFoundException when the email does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.addMember('proj-1', {
          email: 'ghost@b.com',
          role: ProjectRole.MEMBER,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when the user is already a member', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-2',
        email: 'b@b.com',
      });
      mockPrisma.projectMember.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.addMember('proj-1', {
          email: 'b@b.com',
          role: ProjectRole.MEMBER,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── removeMember ────────────────────────────────────────────────────────────

  describe('removeMember', () => {
    it('deletes the membership record', async () => {
      mockPrisma.projectMember.findUnique.mockResolvedValue({ id: 'pm-1' });

      await service.removeMember('proj-1', 'user-2');

      expect(mockPrisma.projectMember.delete).toHaveBeenCalled();
    });

    it('throws NotFoundException when the member does not exist', async () => {
      mockPrisma.projectMember.findUnique.mockResolvedValue(null);

      await expect(service.removeMember('proj-1', 'ghost')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
