import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  @ApiProperty({ example: 'My Team' })
  name: string;

  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must be lowercase letters, numbers, and hyphens only',
  })
  @Length(2, 50)
  @ApiPropertyOptional({
    example: 'my-team',
    description: 'Auto-generated from name if omitted',
  })
  slug?: string;
}
