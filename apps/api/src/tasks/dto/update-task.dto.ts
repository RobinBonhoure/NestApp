import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { Priority } from '../../common/enums';

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  @Length(1, 255)
  @ApiPropertyOptional({ example: 'Implement login page' })
  title?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  description?: string;

  @IsEnum(Priority)
  @IsOptional()
  @ApiPropertyOptional({ enum: Priority })
  priority?: Priority;

  @IsDateString()
  @IsOptional()
  @ApiPropertyOptional()
  dueDate?: string;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Set to true to mark as complete, false to reopen' })
  completed?: boolean;
}
