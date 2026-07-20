import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class MoveTaskDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'Target column ID (can be the same column)' })
  columnId: string;

  @IsInt()
  @Min(0)
  @ApiProperty({ description: 'New position index within the target column' })
  position: number;
}
