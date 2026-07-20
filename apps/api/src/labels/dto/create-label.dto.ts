import { ApiProperty } from '@nestjs/swagger';
import {
  IsHexColor,
  IsNotEmpty,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class CreateLabelDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'Project this label belongs to' })
  projectId: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  @ApiProperty({ example: 'bug' })
  name: string;

  @IsHexColor()
  @IsNotEmpty()
  @ApiProperty({ example: '#ef4444' })
  color: string;
}
