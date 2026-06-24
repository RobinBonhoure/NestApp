import {
  Controller,
  Post,
  Request,
  UseGuards,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiCreatedResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register and get a JWT' })
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({ description: 'Returns access_token' })
  @ApiConflictResponse({ description: 'Email already in use' })
  register(@Body() dto: CreateUserDto) {
    return this.authService.register(dto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and get a JWT' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ description: 'Returns access_token' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  login(@Request() req: { user: { id: string; email: string } }) {
    return this.authService.login(req.user);
  }
}
