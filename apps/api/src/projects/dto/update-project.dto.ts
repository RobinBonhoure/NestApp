import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsHexColor, IsOptional, IsString, Length } from 'class-validator';

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  @Length(2, 50)
  @ApiPropertyOptional({ example: 'Renamed Project' })
  name?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  description?: string;

  @IsHexColor()
  @IsOptional()
  @ApiPropertyOptional({ example: '#22c55e' })
  color?: string;
}
