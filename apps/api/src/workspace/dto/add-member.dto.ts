import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { WorkspaceRole } from '../../common/enums';

export class AddWorkspaceMemberDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ example: 'jane@example.com' })
  email: string;

  @IsEnum(WorkspaceRole)
  @IsOptional()
  @ApiPropertyOptional({ enum: WorkspaceRole, default: WorkspaceRole.MEMBER })
  role?: WorkspaceRole = WorkspaceRole.MEMBER;
}
