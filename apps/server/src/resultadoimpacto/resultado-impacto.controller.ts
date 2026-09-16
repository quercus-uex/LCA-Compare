import { ResultadoImpactoService } from './resultado-impacto.service';
import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser, type UserJwt } from '../auth/auth-user.decorator';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorDto } from '../common/dto/api-error.dto';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { ResultadoImpactoDto } from './dto/resultado-impacto.dto';

@ApiTags('Resultado de ACV')
@ApiBearerAuth()
@Controller('/resultado')
export class ResultadoImpactoController {
  constructor(
    private readonly resultadoImpactoService: ResultadoImpactoService,
  ) {}

  @UseGuards(AuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un resultado de ACV por ID' })
  @ApiUnauthorizedResponse({
    description:
      'Usuario no autenticado o usuario no es propietario de la parcela',
    type: ApiErrorDto,
  })
  @ApiOkResponse({
    description: 'Resultado de ACV',
    type: ApiResponseDto(ResultadoImpactoDto),
  })
  async getById(@AuthUser() user: UserJwt, @Param('id') id: string) {
    const resultado = await this.resultadoImpactoService.findOne({ id });
    if (!resultado) throw new NotFoundException();
    if (resultado.cultivo!.parcela.idPropietario !== user.sub)
      throw new UnauthorizedException('No eres el propietario de esta parcela');

    return { data: resultado };
  }
}
