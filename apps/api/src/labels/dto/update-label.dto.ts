import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsHexColor, IsOptional, IsString, Length } from 'class-validator';

export class UpdateLabelDto {
  @IsString()
  @IsOptional()
  @Length(1, 50)
  @ApiPropertyOptional({ example: 'enhancement' })
  name?: string;

  @IsHexColor()
  @IsOptional()
  @ApiPropertyOptional({ example: '#22c55e' })
  color?: string;
}
