import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { Priority } from '../../common/enums';

export class CreateTaskDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'Column this task belongs to' })
  columnId: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  @ApiProperty({ example: 'Implement login page' })
  title: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'Should support email + Google OAuth' })
  description?: string;

  @IsEnum(Priority)
  @IsOptional()
  @ApiPropertyOptional({ enum: Priority, default: Priority.NONE })
  priority?: Priority;

  @IsDateString()
  @IsOptional()
  @ApiPropertyOptional({ example: '2026-07-15T00:00:00.000Z' })
  dueDate?: string;

  @IsUUID()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Parent task ID for subtasks' })
  parentId?: string;
}
