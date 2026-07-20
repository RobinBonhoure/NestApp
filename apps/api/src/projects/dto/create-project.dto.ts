import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsHexColor,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';

export class CreateProjectDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'Workspace this project belongs to' })
  workspaceId: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  @ApiProperty({ example: 'My Project' })
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 6)
  @Matches(/^[A-Z0-9]+$/, { message: 'Key must be uppercase letters and numbers only' })
  @ApiProperty({ example: 'PROJ', description: 'Short prefix for ticket IDs (e.g. PROJ-1)' })
  key: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'A project for building the web app' })
  description?: string;

  @IsHexColor()
  @IsOptional()
  @ApiPropertyOptional({ example: '#6366f1' })
  color?: string;
}
