import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class ReorderTasksDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  @ApiProperty({
    type: [String],
    description: 'Full ordered list of task IDs within a column',
    example: ['uuid-task-3', 'uuid-task-1', 'uuid-task-2'],
  })
  taskIds: string[];
}
