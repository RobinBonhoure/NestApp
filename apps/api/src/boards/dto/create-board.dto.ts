import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';

export class CreateBoardDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'Project this board belongs to' })
  projectId: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  @ApiProperty({ example: 'Sprint 1' })
  name: string;
}
