import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { ProjectRole } from '../../common/enums';

export class AddProjectMemberDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ example: 'jane@example.com' })
  email: string;

  @IsEnum(ProjectRole)
  @IsOptional()
  @ApiPropertyOptional({ enum: ProjectRole, default: ProjectRole.MEMBER })
  role?: ProjectRole = ProjectRole.MEMBER;
}
