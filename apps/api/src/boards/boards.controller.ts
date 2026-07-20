import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  AuthUser,
} from '../auth/decorators/current-user.decorator';

@ApiTags('boards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a board inside a project' })
  @ApiCreatedResponse({ description: 'Board created' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBoardDto) {
    return this.boardsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List boards in a project' })
  @ApiQuery({ name: 'projectId', type: String })
  @ApiOkResponse({ description: 'List of boards' })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.boardsService.findAllInProject(projectId, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a board with all columns and tasks' })
  @ApiOkResponse({ description: 'Full board detail' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.boardsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Rename a board' })
  @ApiOkResponse({ description: 'Board updated' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBoardDto) {
    return this.boardsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a board' })
  @ApiNoContentResponse({ description: 'Board deleted' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.boardsService.remove(id);
  }
}
