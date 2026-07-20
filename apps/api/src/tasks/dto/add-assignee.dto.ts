import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AddAssigneeDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty()
  userId: string;
}
