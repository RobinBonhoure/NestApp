import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class ReorderColumnsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  @ApiProperty({
    type: [String],
    description: 'Full ordered list of column IDs — positions are set to array index',
    example: ['uuid-col-2', 'uuid-col-1', 'uuid-col-3'],
  })
  columnIds: string[];
}
