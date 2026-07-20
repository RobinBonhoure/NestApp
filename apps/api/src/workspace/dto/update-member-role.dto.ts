import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { WorkspaceRole } from '../../common/enums';

export class UpdateWorkspaceMemberRoleDto {
  @IsEnum(WorkspaceRole)
  @IsNotEmpty()
  @ApiProperty({ enum: WorkspaceRole })
  role: WorkspaceRole;
}
