import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findById', () => {
    it('returns the user when found', async () => {
      const user = { id: 'user-1', email: 'a@b.com', name: 'Alice' };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await service.findById('user-1');

      expect(result).toEqual(user);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('ghost')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('delegates to prisma with the email', async () => {
      const user = { id: 'user-1', email: 'a@b.com' };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await service.findByEmail('a@b.com');

      expect(result).toEqual(user);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'a@b.com' },
      });
    });

    it('returns null when no user has that email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('unknown@b.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('hashes the password before persisting', async () => {
      const plain = 'mysecret';
      let capturedData: { password: string } | undefined;

      mockPrisma.user.create.mockImplementation(
        ({ data }: { data: { password: string } }) => {
          capturedData = data;
          return Promise.resolve({ id: 'new', email: 'x@b.com', ...data });
        },
      );

      await service.create({
        name: 'Alice',
        email: 'x@b.com',
        password: plain,
      });

      expect(capturedData).toBeDefined();
      const passwordStored = capturedData!.password;
      expect(passwordStored).not.toBe(plain);
      expect(await bcrypt.compare(plain, passwordStored)).toBe(true);
    });
  });
});
