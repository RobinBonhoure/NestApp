import {
  Controller,
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
} from '@nestjs/swagger';
import { ColumnsService } from './columns.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { ReorderColumnsDto } from './dto/reorder-columns.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('columns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('columns')
export class ColumnsController {
  constructor(private readonly columnsService: ColumnsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a column to a board (appended at the end)' })
  @ApiCreatedResponse({ description: 'Column created' })
  create(@Body() dto: CreateColumnDto) {
    return this.columnsService.create(dto);
  }

  @Patch('reorder/:boardId')
  @ApiOperation({
    summary: 'Reorder all columns on a board — send full ordered list of IDs',
  })
  @ApiOkResponse({ description: 'Board with updated column order' })
  reorder(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Body() dto: ReorderColumnsDto,
  ) {
    return this.columnsService.reorder(boardId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Rename a column' })
  @ApiOkResponse({ description: 'Column updated' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateColumnDto) {
    return this.columnsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a column and all its tasks' })
  @ApiNoContentResponse({ description: 'Column deleted' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.columnsService.remove(id);
  }
}
