import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { WorkspaceRole } from '../common/enums';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  workspace: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  workspaceMember: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

describe('WorkspaceService', () => {
  let service: WorkspaceService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<WorkspaceService>(WorkspaceService);
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('auto-generates slug from name and creates the workspace', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      const created = {
        id: 'ws-1',
        name: 'My Team',
        slug: 'my-team',
        members: [],
      };
      mockPrisma.workspace.create.mockResolvedValue(created);

      const result = await service.create('user-1', { name: 'My Team' });

      expect(mockPrisma.workspace.findUnique).toHaveBeenCalledWith({
        where: { slug: 'my-team' },
      });
      expect(mockPrisma.workspace.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'My Team', slug: 'my-team' }),
        }),
      );
      expect(result).toEqual(created);
    });

    it('uses a provided slug instead of generating one', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.workspace.create.mockResolvedValue({
        id: 'ws-2',
        name: 'X',
        slug: 'custom',
        members: [],
      });

      await service.create('user-1', { name: 'X', slug: 'custom' });

      expect(mockPrisma.workspace.findUnique).toHaveBeenCalledWith({
        where: { slug: 'custom' },
      });
    });

    it('throws ConflictException when the slug is already taken', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({ id: 'other-ws' });

      await expect(
        service.create('user-1', { name: 'My Team' }),
      ).rejects.toThrow(ConflictException);
      expect(mockPrisma.workspace.create).not.toHaveBeenCalled();
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the workspace when the user is a member', async () => {
      const ws = {
        id: 'ws-1',
        members: [{ user: { id: 'user-1' } }],
      };
      mockPrisma.workspace.findUnique.mockResolvedValue(ws);

      const result = await service.findOne('ws-1', 'user-1');

      expect(result).toEqual(ws);
    });

    it('throws NotFoundException when workspace does not exist', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      await expect(service.findOne('ghost', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when the user is not a member', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 'ws-1',
        members: [{ user: { id: 'other-user' } }],
      });

      await expect(service.findOne('ws-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── addMember ───────────────────────────────────────────────────────────────

  describe('addMember', () => {
    it('creates a membership record for an existing user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-2',
        email: 'b@b.com',
      });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);
      const member = {
        id: 'mem-1',
        role: WorkspaceRole.MEMBER,
        joinedAt: new Date(),
        user: { id: 'user-2' },
      };
      mockPrisma.workspaceMember.create.mockResolvedValue(member);

      const result = await service.addMember('ws-1', {
        email: 'b@b.com',
        role: WorkspaceRole.MEMBER,
      });

      expect(result).toEqual(member);
      expect(mockPrisma.workspaceMember.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            workspaceId: 'ws-1',
            userId: 'user-2',
            role: WorkspaceRole.MEMBER,
          },
        }),
      );
    });

    it('throws NotFoundException when the invited email does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.addMember('ws-1', {
          email: 'ghost@b.com',
          role: WorkspaceRole.MEMBER,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when the user is already a member', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-2',
        email: 'b@b.com',
      });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        id: 'existing-mem',
      });

      await expect(
        service.addMember('ws-1', {
          email: 'b@b.com',
          role: WorkspaceRole.MEMBER,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── updateMemberRole ────────────────────────────────────────────────────────

  describe('updateMemberRole', () => {
    it('updates the role of a non-owner member', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        id: 'mem-1',
        role: WorkspaceRole.MEMBER,
      });
      mockPrisma.workspaceMember.update.mockResolvedValue({
        id: 'mem-1',
        role: WorkspaceRole.ADMIN,
      });

      const result = await service.updateMemberRole('ws-1', 'user-2', {
        role: WorkspaceRole.ADMIN,
      });

      expect(result).toEqual({ id: 'mem-1', role: WorkspaceRole.ADMIN });
    });

    it('throws NotFoundException when the member does not exist', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(
        service.updateMemberRole('ws-1', 'ghost', {
          role: WorkspaceRole.ADMIN,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when trying to change the OWNER role', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        id: 'mem-1',
        role: WorkspaceRole.OWNER,
      });

      await expect(
        service.updateMemberRole('ws-1', 'owner-id', {
          role: WorkspaceRole.ADMIN,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── removeMember ────────────────────────────────────────────────────────────

  describe('removeMember', () => {
    it('deletes the membership record', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        id: 'mem-1',
        role: WorkspaceRole.MEMBER,
      });

      await service.removeMember('ws-1', 'user-2');

      expect(mockPrisma.workspaceMember.delete).toHaveBeenCalled();
    });

    it('throws NotFoundException when the member does not exist', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(service.removeMember('ws-1', 'ghost')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when trying to remove the OWNER', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        id: 'mem-1',
        role: WorkspaceRole.OWNER,
      });

      await expect(service.removeMember('ws-1', 'owner-id')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
