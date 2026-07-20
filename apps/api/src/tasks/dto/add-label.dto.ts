import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AddLabelDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty()
  labelId: string;
}
