import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';

export class CreateColumnDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'Board this column belongs to' })
  boardId: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  @ApiProperty({ example: 'In Review' })
  name: string;
}
