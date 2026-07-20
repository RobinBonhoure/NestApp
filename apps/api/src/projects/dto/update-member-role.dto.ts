import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ProjectRole } from '../../common/enums';

export class UpdateProjectMemberRoleDto {
  @IsEnum(ProjectRole)
  @IsNotEmpty()
  @ApiProperty({ enum: ProjectRole })
  role: ProjectRole;
}
