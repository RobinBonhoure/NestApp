import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { ReorderTasksDto } from './dto/reorder-tasks.dto';
import { AddAssigneeDto } from './dto/add-assignee.dto';
import { AddLabelDto } from './dto/add-label.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  AuthUser,
} from '../auth/decorators/current-user.decorator';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a task in a column' })
  @ApiCreatedResponse({ description: 'Task created' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Get a task with full detail (comments, assignees, labels, subtasks)',
  })
  @ApiOkResponse({ description: 'Task detail' })
  @ApiNotFoundResponse({ description: 'Task not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary:
      'Update task fields (title, description, priority, dueDate, completed)',
  })
  @ApiOkResponse({ description: 'Task updated' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a task' })
  @ApiNoContentResponse({ description: 'Task deleted' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.tasksService.remove(id);
  }

  @Patch(':id/move')
  @ApiOperation({ summary: 'Move a task to a different column or position' })
  @ApiOkResponse({ description: 'Task moved' })
  move(@Param('id', ParseUUIDPipe) id: string, @Body() dto: MoveTaskDto) {
    return this.tasksService.move(id, dto);
  }

  @Patch('reorder/:columnId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Reorder tasks within a column — send full ordered list of IDs',
  })
  @ApiNoContentResponse({ description: 'Tasks reordered' })
  async reorder(
    @Param('columnId', ParseUUIDPipe) columnId: string,
    @Body() dto: ReorderTasksDto,
  ) {
    await this.tasksService.reorder(columnId, dto);
  }

  // ─── Assignees ─────────────────────────────────────────────────────────────

  @Post(':id/assignees')
  @ApiOperation({ summary: 'Assign a user to a task' })
  @ApiCreatedResponse({ description: 'Assignee added' })
  addAssignee(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddAssigneeDto,
  ) {
    return this.tasksService.addAssignee(id, dto);
  }

  @Delete(':id/assignees/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an assignee from a task' })
  @ApiNoContentResponse({ description: 'Assignee removed' })
  async removeAssignee(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    await this.tasksService.removeAssignee(id, userId);
  }

  // ─── Labels ────────────────────────────────────────────────────────────────

  @Post(':id/labels')
  @ApiOperation({ summary: 'Attach a label to a task' })
  @ApiCreatedResponse({ description: 'Label attached' })
  addLabel(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddLabelDto) {
    return this.tasksService.addLabel(id, dto);
  }

  @Delete(':id/labels/:labelId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Detach a label from a task' })
  @ApiNoContentResponse({ description: 'Label removed' })
  async removeLabel(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('labelId', ParseUUIDPipe) labelId: string,
  ) {
    await this.tasksService.removeLabel(id, labelId);
  }
}
