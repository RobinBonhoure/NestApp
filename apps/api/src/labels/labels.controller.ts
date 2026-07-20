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
import { LabelsService } from './labels.service';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('labels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('labels')
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a label in a project' })
  @ApiCreatedResponse({ description: 'Label created' })
  create(@Body() dto: CreateLabelDto) {
    return this.labelsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all labels in a project' })
  @ApiQuery({ name: 'projectId', type: String })
  @ApiOkResponse({ description: 'List of labels' })
  findAll(@Query('projectId', ParseUUIDPipe) projectId: string) {
    return this.labelsService.findAllInProject(projectId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a label name or color' })
  @ApiOkResponse({ description: 'Label updated' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLabelDto) {
    return this.labelsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a label (detaches from all tasks automatically)',
  })
  @ApiNoContentResponse({ description: 'Label deleted' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.labelsService.remove(id);
  }
}
