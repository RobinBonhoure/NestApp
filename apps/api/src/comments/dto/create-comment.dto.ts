import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty()
  taskId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Looks good, but needs more test coverage.' })
  content: string;
}
