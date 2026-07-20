import { Module } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceRoleGuard } from '../auth/guards/workspace-role.guard';

@Module({
  providers: [WorkspaceService, WorkspaceRoleGuard],
  controllers: [WorkspaceController],
})
export class WorkspaceModule {}
