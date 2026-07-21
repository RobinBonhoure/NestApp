import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

const mockUsersService = {
  findByEmail: jest.fn(),
  create: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('signed.jwt.token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    it('returns { id, email } when credentials are correct', async () => {
      const hashed = await bcrypt.hash('secret', 10);
      mockUsersService.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'a@b.com',
        password: hashed,
      });

      const result = await service.validateUser('a@b.com', 'secret');

      expect(result).toEqual({ id: 'user-1', email: 'a@b.com' });
    });

    it('returns null when password is wrong', async () => {
      const hashed = await bcrypt.hash('correct', 10);
      mockUsersService.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'a@b.com',
        password: hashed,
      });

      const result = await service.validateUser('a@b.com', 'wrong');

      expect(result).toBeNull();
    });

    it('returns null when user does not exist', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('nobody@b.com', 'pass');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('returns an access_token signed with user id and email', () => {
      const result = service.login({ id: 'user-1', email: 'a@b.com' });

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'a@b.com',
      });
      expect(result).toEqual({ access_token: 'signed.jwt.token' });
    });
  });

  describe('register', () => {
    it('creates the user and returns an access_token for a new email', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue({
        id: 'new-user',
        email: 'new@b.com',
      });

      const result = await service.register({
        name: 'Alice',
        email: 'new@b.com',
        password: 'pass',
      });

      expect(mockUsersService.create).toHaveBeenCalledWith({
        name: 'Alice',
        email: 'new@b.com',
        password: 'pass',
      });
      expect(result).toEqual({ access_token: 'signed.jwt.token' });
    });

    it('throws ConflictException when the email is already taken', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        id: 'existing',
        email: 'taken@b.com',
      });

      await expect(
        service.register({
          name: 'Bob',
          email: 'taken@b.com',
          password: 'pass',
        }),
      ).rejects.toThrow(ConflictException);

      expect(mockUsersService.create).not.toHaveBeenCalled();
    });
  });
});
