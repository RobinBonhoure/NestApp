import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { ProjectsModule } from './projects/projects.module';
import { BoardsModule } from './boards/boards.module';
import { ColumnsModule } from './columns/columns.module';
import { TasksModule } from './tasks/tasks.module';
import { CommentsModule } from './comments/comments.module';
import { LabelsModule } from './labels/labels.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    WorkspaceModule,
    ProjectsModule,
    BoardsModule,
    ColumnsModule,
    TasksModule,
    CommentsModule,
    LabelsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
