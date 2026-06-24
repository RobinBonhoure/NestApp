import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @Length(3, 50, { message: 'Name must be between 3 and 50 characters' })
  @ApiProperty({
    description: 'The name of the profile',
    example: 'John Doe',
  })
  name: string;

  @IsEmail()
  @IsNotEmpty({ message: 'Email is required' })
  @ApiProperty({
    description: 'The email of the profile',
    example: 'john.doe@example.com',
  })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @Length(6, 20, { message: 'Password must be between 6 and 20 characters' })
  @ApiProperty({
    description: 'The password of the profile',
    example: 'P@ssw0rd',
  })
  password: string;
}
