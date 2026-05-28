import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LoginSuccessDto } from './dto/login-success.dto';
import { ApiErrorDto } from '../common/dto/api-error.dto';
import { ApiResponseDto } from '../common/dto/api-response.dto';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiUnauthorizedResponse({
    description: 'Credenciales inválidas',
    type: ApiErrorDto,
  })
  @ApiOkResponse({
    description: 'Sesión iniciada con éxito',
    type: ApiResponseDto(LoginSuccessDto),
  })
  @HttpCode(HttpStatus.OK)
  async login(@Body() data: LoginDto) {
    return {
      data: await this.authService.login(data.email, data.password),
    };
  }
}
